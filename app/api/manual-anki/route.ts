import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, meaning, imageFile, imageUrlInput, deckName } = body;

    if (!word || !meaning) {
      return NextResponse.json(
        { error: "単語と意味は必須です" },
        { status: 400 }
      );
    }

    let imageFileName = "";
    let imageHtml = "";

    // ファイルアップロードされた画像の処理
    if (imageFile && imageFile.data) {
      try {
        // AnkiConnectのstoreMediaFileアクションで画像を保存
        const storeMediaResponse = await fetch("http://127.0.0.1:8765", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "storeMediaFile",
            version: 6,
            params: {
              filename: imageFile.filename,
              data: imageFile.data,
            },
          }),
        });

        const storeMediaResult = await storeMediaResponse.json();
        if (storeMediaResult.error) {
          console.log(`画像保存エラー: ${storeMediaResult.error}`);
        } else {
          imageFileName = imageFile.filename;
          imageHtml = `<img src="${imageFileName}">`;
          console.log(`画像保存成功: ${imageFileName}`);
        }
      } catch (imageError) {
        console.log(`画像処理エラー: ${imageError}`);
      }
    }
    // URL画像の処理
    else if (imageUrlInput) {
      imageHtml = `<img src="${imageUrlInput}">`;
      console.log(`画像URL設定: ${imageUrlInput}`);
    }

    // AnkiConnectでモデル名を取得
    const modelNamesResponse = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    // モデルのフィールド名を取得
    const modelFieldsResponse = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "modelFieldNames",
        version: 6,
        params: {
          modelName: modelName,
        },
      }),
    });

    const modelFieldsResult = await modelFieldsResponse.json();
    const fieldNames = modelFieldsResult.result || ["Front", "Back"];

    // フィールドの設定
    const fields: Record<string, string> = {};

    // 単語フィールド
    if (fieldNames.includes("センテンス")) {
      fields["センテンス"] = word;
    } else {
      fields[fieldNames[0]] = word;
    }

    // 意味フィールド
    if (fieldNames.includes("日本語の意味")) {
      fields["日本語の意味"] = meaning;
    } else if (fieldNames.length > 1) {
      fields[fieldNames[1]] = meaning;
    } else {
      // フィールドが1つしかない場合は、単語と意味を組み合わせる
      fields[fieldNames[0]] = `${word}\n\n${meaning}`;
    }

    // 画像フィールド
    if (fieldNames.includes("画像") && imageHtml) {
      fields["画像"] = imageHtml;
    } else if (imageHtml && fieldNames.length > 2) {
      // 画像専用フィールドがない場合、3番目のフィールドに設定
      fields[fieldNames[2]] = imageHtml;
    } else if (imageHtml && fieldNames.length === 2) {
      // フィールドが2つしかない場合、意味フィールドに画像を追加
      const meaningField = fieldNames.includes("日本語の意味") ? "日本語の意味" : fieldNames[1];
      fields[meaningField] += `<br><br>${imageHtml}`;
    }

    // 語源フィールドがある場合は空にしておく
    if (fieldNames.includes("語源")) {
      fields["語源"] = "";
    }

    // Ankiにノートを追加
    const ankiNote = {
      action: "addNote",
      version: 6,
      params: {
        note: {
          deckName: deckName || "Default",
          modelName: modelName,
          fields: fields,
          tags: ["vocabulary", "manual", "anki-pocket"],
        },
      },
    };

    const response = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ankiNote),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      noteId: result.result,
      imageAdded: !!imageHtml,
    });

  } catch (error) {
    console.error("Manual Anki API error:", error);

    let errorMessage = "不明なエラーが発生しました";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}