import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, deckName } = body;

    // バリデーション
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Text parameter is required", success: false },
        { status: 400 }
      );
    }

    if (!deckName || !deckName.trim()) {
      return NextResponse.json(
        { error: "DeckName parameter is required", success: false },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    const isPhrase = trimmedText.includes(' ') || trimmedText.split(/\s+/).length > 1;

    let definition = null;
    let translatedText = null;
    let imageUrl = null;

    try {
      if (isPhrase) {
        // 文章の場合：翻訳処理
        const translateResponse = await fetch(
          `${request.nextUrl.origin}/api/translate?text=${encodeURIComponent(trimmedText)}&from=en&to=ja`
        );

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          if (translateData.success) {
            translatedText = translateData.translatedText;
          }
        }

        // 画像生成（文章の最初の単語を使用）
        const firstWord = trimmedText.split(/\s+/)[0];
        const imageResponse = await fetch(
          `${request.nextUrl.origin}/api/unsplash?query=${encodeURIComponent(firstWord)}`
        );

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        }
      } else {
        // 単語の場合：辞書検索
        const dictResponse = await fetch(
          `${request.nextUrl.origin}/api/dictionary?word=${encodeURIComponent(trimmedText)}`
        );

        if (dictResponse.ok) {
          const dictData = await dictResponse.json();
          if (dictData.success && dictData.definitions && dictData.definitions.length > 0) {
            definition = dictData.definitions[0];
          }
        }

        // 画像生成
        const imageResponse = await fetch(
          `${request.nextUrl.origin}/api/unsplash?query=${encodeURIComponent(trimmedText)}`
        );

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        }
      }

      // Anki送信処理
      let ankiNoteId = null;
      try {
        ankiNoteId = await sendToAnki({
          text: trimmedText,
          definition,
          translatedText,
          imageUrl,
          deckName
        });
      } catch (ankiError) {
        console.error('AnkiConnect error:', ankiError);
        return NextResponse.json(
          {
            error: `AnkiConnect接続エラー: ${ankiError instanceof Error ? ankiError.message : String(ankiError)}`,
            success: false
          },
          { status: 500 }
        );
      }

      // 成功レスポンス
      const response = {
        success: true,
        type: isPhrase ? 'phrase' : 'word',
        ...(isPhrase ? {
          originalText: trimmedText,
          translatedText
        } : {
          word: trimmedText,
          definition
        }),
        imageUrl,
        ankiNoteId
      };

      return NextResponse.json(response);

    } catch (error) {
      console.error('Processing error:', error);
      return NextResponse.json(
        {
          error: `処理エラー: ${error instanceof Error ? error.message : String(error)}`,
          success: false
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      {
        error: 'Invalid request format',
        success: false
      },
      { status: 400 }
    );
  }
}

// Anki送信用のヘルパー関数
async function sendToAnki({
  text,
  definition,
  translatedText,
  imageUrl,
  deckName
}: {
  text: string;
  definition?: any;
  translatedText?: string;
  imageUrl?: string;
  deckName: string;
}) {
  let imageFileName = "";

  // 画像処理
  if (imageUrl) {
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();

      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(",")[1]);
        };
        reader.readAsDataURL(imageBlob);
      });

      const timestamp = Date.now();
      const extension = imageUrl.includes(".jpg") || imageUrl.includes(".jpeg") ? "jpg" : "png";
      imageFileName = `${text.replace(/\s+/g, '_')}_${timestamp}.${extension}`;

      const storeMediaResponse = await fetch("http://127.0.0.1:8765", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "storeMediaFile",
          version: 6,
          params: {
            filename: imageFileName,
            data: base64Data,
          },
        }),
      });

      const storeMediaResult = await storeMediaResponse.json();
      if (storeMediaResult.error) {
        console.log(`画像保存エラー: ${storeMediaResult.error}`);
        imageFileName = "";
      }
    } catch (imageError) {
      console.log(`画像処理エラー: ${imageError}`);
      imageFileName = "";
    }
  }

  // モデル名取得
  const modelNamesResponse = await fetch("http://127.0.0.1:8765", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "modelNames",
      version: 6,
    }),
  });

  if (!modelNamesResponse.ok) {
    throw new Error("AnkiConnectに接続できません");
  }

  const modelNamesResult = await modelNamesResponse.json();
  if (modelNamesResult.error) {
    throw new Error(modelNamesResult.error);
  }

  const availableModels = modelNamesResult.result;
  if (!availableModels || availableModels.length === 0) {
    throw new Error("利用可能なノートタイプが見つかりません");
  }

  const modelName = availableModels[0];

  // フィールド名取得
  const modelFieldsResponse = await fetch("http://127.0.0.1:8765", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "modelFieldNames",
      version: 6,
      params: { modelName },
    }),
  });

  const modelFieldsResult = await modelFieldsResponse.json();
  const fieldNames = modelFieldsResult.result || ["Front", "Back"];

  // フィールド構築
  const fields: Record<string, string> = {};

  if (definition) {
    // 単語の場合
    if (fieldNames.includes("センテンス")) {
      fields["センテンス"] = definition.phonetic
        ? `${text} /${definition.phonetic}/`
        : text;
    } else {
      fields[fieldNames[0]] = definition.phonetic
        ? `${text} /${definition.phonetic}/`
        : text;
    }

    if (fieldNames.includes("日本語の意味")) {
      fields["日本語の意味"] = definition.meanings
        .map((meaning: any) =>
          `${meaning.partOfSpeech}: ${meaning.definitions[0].definition}`
        )
        .join("\n");
    }

    if (fieldNames.includes("画像") && imageFileName) {
      fields["画像"] = `<img src="${imageFileName}">`;
    }

    // フォールバック
    if (!fieldNames.includes("センテンス") && !fieldNames.includes("日本語の意味")) {
      fields[fieldNames[1] || fieldNames[0]] = `
        <div style="font-family: Arial, sans-serif;">
          ${definition.meanings
            .map((meaning: any) => `
            <p><strong>${meaning.partOfSpeech}:</strong> ${meaning.definitions[0].definition}</p>
            ${meaning.definitions[0].example
              ? `<p><em>例文: "${meaning.definitions[0].example}"</em></p>`
              : ""
            }
          `)
            .join("")}
          ${imageFileName ? `<br><img src="${imageFileName}">` : ""}
        </div>
      `;
    }
  } else if (translatedText) {
    // 文章の場合
    fields[fieldNames[0]] = text;
    fields[fieldNames[1] || fieldNames[0]] = `
      <div style="font-family: Arial, sans-serif;">
        <p><strong>翻訳:</strong> ${translatedText}</p>
        ${imageFileName ? `<br><img src="${imageFileName}">` : ""}
      </div>
    `;
  }

  // ノート追加
  const ankiNote = {
    action: "addNote",
    version: 6,
    params: {
      note: {
        deckName,
        modelName,
        fields,
        tags: ["vocabulary", "english", "auto-generated"],
      },
    },
  };

  const addNoteResponse = await fetch("http://127.0.0.1:8765", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ankiNote),
  });

  if (!addNoteResponse.ok) {
    throw new Error(`HTTP ${addNoteResponse.status}: ${addNoteResponse.statusText}`);
  }

  const result = await addNoteResponse.json();
  if (result.error) {
    throw new Error(result.error);
  }

  return result.result;
}