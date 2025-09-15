import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, deckName } = body;

    // Validation
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
        // For phrases: translation processing
        const translateResponse = await fetch(
          `${request.nextUrl.origin}/api/translate?text=${encodeURIComponent(trimmedText)}&from=en&to=ja`
        );

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          if (translateData.success) {
            translatedText = translateData.translatedText;
          }
        }

        // Image generation (using the first word of the phrase)
        const firstWord = trimmedText.split(/\s+/)[0];
        const imageResponse = await fetch(
          `${request.nextUrl.origin}/api/unsplash?query=${encodeURIComponent(firstWord)}`
        );

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        }
      } else {
        // For words: dictionary lookup
        const dictResponse = await fetch(
          `${request.nextUrl.origin}/api/dictionary?word=${encodeURIComponent(trimmedText)}`
        );

        if (dictResponse.ok) {
          const dictData = await dictResponse.json();
          if (dictData.success && dictData.definitions && dictData.definitions.length > 0) {
            definition = dictData.definitions[0];
          }
        }

        // Image generation
        const imageResponse = await fetch(
          `${request.nextUrl.origin}/api/unsplash?query=${encodeURIComponent(trimmedText)}`
        );

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        }
      }

      // Anki submission processing
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
            error: `AnkiConnect connection error: ${ankiError instanceof Error ? ankiError.message : String(ankiError)}`,
            success: false
          },
          { status: 500 }
        );
      }

      // Success response
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
          error: `Processing error: ${error instanceof Error ? error.message : String(error)}`,
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

// Helper function for Anki submission
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

  // Image processing
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
        console.log(`Image save error: ${storeMediaResult.error}`);
        imageFileName = "";
      }
    } catch (imageError) {
      console.log(`Image processing error: ${imageError}`);
      imageFileName = "";
    }
  }

  // Get model names
  const modelNamesResponse = await fetch("http://127.0.0.1:8765", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "modelNames",
      version: 6,
    }),
  });

  if (!modelNamesResponse.ok) {
    throw new Error("Cannot connect to AnkiConnect");
  }

  const modelNamesResult = await modelNamesResponse.json();
  if (modelNamesResult.error) {
    throw new Error(modelNamesResult.error);
  }

  const availableModels = modelNamesResult.result;
  if (!availableModels || availableModels.length === 0) {
    throw new Error("No available note types found");
  }

  const modelName = availableModels[0];

  // Get field names
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

  // Build fields
  const fields: Record<string, string> = {};

  if (definition) {
    // For words
    if (fieldNames.includes("Sentence")) {
      fields["Sentence"] = definition.phonetic
        ? `${text} /${definition.phonetic}/`
        : text;
    } else {
      fields[fieldNames[0]] = definition.phonetic
        ? `${text} /${definition.phonetic}/`
        : text;
    }

    if (fieldNames.includes("Japanese Meaning")) {
      fields["Japanese Meaning"] = definition.meanings
        .map((meaning: any) =>
          `${meaning.partOfSpeech}: ${meaning.definitions[0].definition}`
        )
        .join("\n");
    }

    if (fieldNames.includes("Image") && imageFileName) {
      fields["Image"] = `<img src="${imageFileName}">`;
    }

    // Fallback
    if (!fieldNames.includes("Sentence") && !fieldNames.includes("Japanese Meaning")) {
      fields[fieldNames[1] || fieldNames[0]] = `
        <div style="font-family: Arial, sans-serif;">
          ${definition.meanings
            .map((meaning: any) => `
            <p><strong>${meaning.partOfSpeech}:</strong> ${meaning.definitions[0].definition}</p>
            ${meaning.definitions[0].example
              ? `<p><em>Example: "${meaning.definitions[0].example}"</em></p>`
              : ""
            }
          `)
            .join("")}
          ${imageFileName ? `<br><img src="${imageFileName}">` : ""}
        </div>
      `;
    }
  } else if (translatedText) {
    // For phrases
    fields[fieldNames[0]] = text;
    fields[fieldNames[1] || fieldNames[0]] = `
      <div style="font-family: Arial, sans-serif;">
        <p><strong>Translation:</strong> ${translatedText}</p>
        ${imageFileName ? `<br><img src="${imageFileName}">` : ""}
      </div>
    `;
  }

  // Add note
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