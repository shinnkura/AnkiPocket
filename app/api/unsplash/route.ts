import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  console.log("[v0] Image generation request for:", query);

  try {
    const envAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    const accessKey = envAccessKey;

    console.log("[v0] Environment variables check:");
    console.log("[v0] - UNSPLASH_ACCESS_KEY exists:", !!envAccessKey);
    console.log("[v0] - Using hardcoded key:", !envAccessKey);
    console.log("[v0] - Final key length:", accessKey ? accessKey.length : 0);

    if (accessKey && accessKey.length > 10) {
      console.log("[v0] Attempting Unsplash API call");
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&per_page=1&client_id=${accessKey}`,
        {
          headers: {
            "Accept-Version": "v1",
          },
        }
      );

      console.log("[v0] Unsplash API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "[v0] Unsplash API response:",
          data.results.length,
          "results"
        );
        if (data.results.length > 0) {
          console.log("[v0] Unsplash image found");
          return NextResponse.json({
            imageUrl: data.results[0].urls.small,
            source: "unsplash",
          });
        }
      } else {
        const errorText = await response.text();
        console.log("[v0] Unsplash API error:", response.status, errorText);
      }
    } else {
      console.log("[v0] Unsplash API key not available or too short");
    }

    const fallbackImageUrl = `https://picsum.photos/300/200?random=${Date.now()}`;
    console.log("[v0] Using fallback image:", fallbackImageUrl);

    return NextResponse.json({
      imageUrl: fallbackImageUrl,
      source: "placeholder",
    });
  } catch (error) {
    console.error("[v0] Unsplash API error:", error);
    return NextResponse.json({
      imageUrl: `https://picsum.photos/300/200?random=${Date.now()}`,
      source: "placeholder",
    });
  }
}
