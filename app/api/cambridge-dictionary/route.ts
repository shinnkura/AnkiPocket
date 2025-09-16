import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json(
      { error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://dictionary.cambridge.org/ja/dictionary/english/${encodeURIComponent(word)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Definition not found' },
        { status: 404 }
      );
    }

    const html = await response.text();

    // Extract definition from the specific div structure
    const definitionMatch = html.match(/<div class="def ddef_d db">(.*?)<\/div>/s);

    if (!definitionMatch) {
      return NextResponse.json(
        { error: 'Definition not found' },
        { status: 404 }
      );
    }

    // Clean up the definition text by removing HTML tags and links
    let definition = definitionMatch[1];

    // Remove all HTML tags but preserve the text content
    definition = definition.replace(/<a[^>]*>(.*?)<\/a>/g, '$1');
    definition = definition.replace(/<[^>]*>/g, '');

    // Clean up extra whitespace
    definition = definition.replace(/\s+/g, ' ').trim();

    return NextResponse.json({
      word,
      definition,
    });

  } catch (error) {
    console.error('Error fetching Cambridge Dictionary definition:', error);
    return NextResponse.json(
      { error: 'Failed to fetch definition' },
      { status: 500 }
    );
  }
}