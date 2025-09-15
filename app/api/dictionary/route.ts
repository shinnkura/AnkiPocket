import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");

  if (!word) {
    return NextResponse.json(
      { error: "Word parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Word not found" },
          { status: 404 }
        );
      }
      throw new Error(`Dictionary API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      word: word,
      definitions: data,
      success: true
    });

  } catch (error) {
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch word definition",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}