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

  console.log("Image generation request for:", query);

  try {
    const envAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    const accessKey = envAccessKey;

    console.log("Environment variables check:");
    console.log("- UNSPLASH_ACCESS_KEY exists:", !!envAccessKey);
    console.log("- Using hardcoded key:", !envAccessKey);
    console.log("- Final key length:", accessKey ? accessKey.length : 0);

    if (accessKey && accessKey.length > 10) {
      console.log("Attempting Unsplash API call");
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

      console.log("Unsplash API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Unsplash API response:", data.results.length, "results");
        if (data.results.length > 0) {
          console.log("Unsplash image found");
          return NextResponse.json({
            imageUrl: data.results[0].urls.small,
            source: "unsplash",
          });
        }
      } else {
        const errorText = await response.text();
        console.log("Unsplash API error:", response.status, errorText);
      }
    } else {
      console.log("Unsplash API key not available or too short");
    }

    const fallbackImageUrl = `https://picsum.photos/300/200?random=${Date.now()}`;
    console.log("Using fallback image:", fallbackImageUrl);

    return NextResponse.json({
      imageUrl: fallbackImageUrl,
      source: "placeholder",
    });
  } catch (error) {
    console.error("Unsplash API error:", error);
    return NextResponse.json({
      imageUrl: `https://picsum.photos/300/200?random=${Date.now()}`,
      source: "placeholder",
    });
  }
}
