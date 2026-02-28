import { NextRequest, NextResponse } from 'next/server';

type SteamGame = {
  appid: number;
  name: string;
  tiny_image?: string;
};

const steamLink = (appid: number) => `https://store.steampowered.com/app/${appid}`;

const mapGame = (game: SteamGame) => ({
  ...game,
  link: steamLink(game.appid)
});

const looksLikeTitle = (query: string) => {
  const words = query.trim().split(/\s+/);
  const hasPunctuation = /[.,!?;:]/.test(query);
  return words.length < 4 && !hasPunctuation;
};

async function searchSteam(term: string): Promise<SteamGame[]> {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=russian&cc=RU`;
  const response = await fetch(url, { next: { revalidate: 120 } });
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as { items?: SteamGame[] };
  return data.items ?? [];
}

async function getPopularGames(): Promise<SteamGame[]> {
  const response = await fetch('https://store.steampowered.com/api/featuredcategories/?cc=RU&l=russian', {
    next: { revalidate: 300 }
  });
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as {
    top_sellers?: { items?: SteamGame[] };
  };
  return data.top_sellers?.items?.slice(0, 5) ?? [];
}

async function resolveByLLM(query: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const prompt =
    'Угадай, о какой игре из Steam говорит пользователь. Верни ТОЛЬКО официальное название игры. Если не уверен, верни "NULL". Запрос: ' +
    query;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const resolved = data.choices?.[0]?.message?.content?.trim();
  if (!resolved || resolved.toUpperCase() === 'NULL') {
    return null;
  }

  return resolved;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const mode = looksLikeTitle(query) ? 'title' : 'description';
  const resolvedTitle = mode === 'description' ? await resolveByLLM(query) : query;
  const steamResults = await searchSteam(resolvedTitle ?? query);

  if (steamResults.length === 1) {
    return NextResponse.json({
      mode,
      resolvedTitle,
      status: 'single',
      results: steamResults.map(mapGame),
      popular: []
    });
  }

  if (steamResults.length > 1) {
    return NextResponse.json({
      mode,
      resolvedTitle,
      status: 'multiple',
      results: steamResults.slice(0, 5).map(mapGame),
      popular: []
    });
  }

  const popular = await getPopularGames();

  return NextResponse.json({
    mode,
    resolvedTitle,
    status: 'none',
    results: [],
    popular: popular.map(mapGame)
  });
}
