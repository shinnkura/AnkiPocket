import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, meaning, imageFile, imageUrlInput, deckName } = body;

    if (!word || !meaning) {
      return NextResponse.json(
        { error: "Word and meaning are required" },
        { status: 400 }
      );
    }

    let imageFileName = "";
    let imageHtml = "";

    // Process uploaded image files
    if (imageFile && imageFile.data) {
      try {
        // Save image using AnkiConnect's storeMediaFile action
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
          console.log(`Image save error: ${storeMediaResult.error}`);
        } else {
          imageFileName = imageFile.filename;
          imageHtml = `<img src="${imageFileName}">`;
          console.log(`Image save success: ${imageFileName}`);
        }
      } catch (imageError) {
        console.log(`Image processing error: ${imageError}`);
      }
    }
    // Process URL images
    else if (imageUrlInput) {
      imageHtml = `<img src="${imageUrlInput}">`;
      console.log(`Image URL set: ${imageUrlInput}`);
    }

    // Get model names using AnkiConnect
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

    // Get model field names
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

    // Field configuration
    const fields: Record<string, string> = {};

    // Word field
    if (fieldNames.includes("Sentence")) {
      fields["Sentence"] = word;
    } else {
      fields[fieldNames[0]] = word;
    }

    // Meaning field
    if (fieldNames.includes("Japanese Meaning")) {
      fields["Japanese Meaning"] = meaning;
    } else if (fieldNames.length > 1) {
      fields[fieldNames[1]] = meaning;
    } else {
      // If there's only one field, combine word and meaning
      fields[fieldNames[0]] = `${word}\n\n${meaning}`;
    }

    // Image field
    if (fieldNames.includes("Image") && imageHtml) {
      fields["Image"] = imageHtml;
    } else if (imageHtml && fieldNames.length > 2) {
      // If there's no dedicated image field, use the third field
      fields[fieldNames[2]] = imageHtml;
    } else if (imageHtml && fieldNames.length === 2) {
      // If there are only two fields, add image to the meaning field
      const meaningField = fieldNames.includes("Japanese Meaning") ? "Japanese Meaning" : fieldNames[1];
      fields[meaningField] += `<br><br>${imageHtml}`;
    }

    // Leave etymology field empty if it exists
    if (fieldNames.includes("Etymology")) {
      fields["Etymology"] = "";
    }

    // Add note to Anki
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

    let errorMessage = "An unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}