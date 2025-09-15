import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const from = searchParams.get("from") || "en";
  const to = searchParams.get("to") || "ja";

  if (!text) {
    return NextResponse.json(
      {
        error: "Text parameter is required",
        success: false
      },
      { status: 400 }
    );
  }

  // Check supported language pairs
  const supportedLanguages = ["en", "ja"];
  if (!supportedLanguages.includes(from) || !supportedLanguages.includes(to)) {
    return NextResponse.json(
      {
        error: "Unsupported language pair",
        success: false
      },
      { status: 400 }
    );
  }

  try {
    // Translate using MyMemory API
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(`Translation failed: ${data.responseDetails || 'Unknown error'}`);
    }

    return NextResponse.json({
      originalText: text,
      translatedText: data.responseData.translatedText,
      from: from,
      to: to,
      success: true
    });

  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      {
        error: "Failed to translate text",
        details: error instanceof Error ? error.message : String(error),
        success: false
      },
      { status: 500 }
    );
  }
}