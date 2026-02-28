'use client';

import { useEffect, useMemo, useState } from 'react';

type Game = {
  appid: number;
  name: string;
  tiny_image?: string;
  link: string;
};

type SearchResponse = {
  mode: 'title' | 'description';
  resolvedTitle?: string | null;
  status: 'single' | 'multiple' | 'none';
  results: Game[];
  popular: Game[];
};

const suggestions = [
  'игра про ведьмака 3',
  'rpg про охоту на монстров',
  'шутер про парня с татуировкой',
  'игра где надо чинить радиостанцию в лесу'
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const randomHint = useMemo(
    () => suggestions[Math.floor(Math.random() * suggestions.length)],
    []
  );

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('steamsearch-history') ?? '[]') as string[];
      setHistory(parsed.slice(0, 5));
    } catch {
      setHistory([]);
    }
  }, []);

  const saveHistory = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const next = [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, 5);
    setHistory(next);
    localStorage.setItem('steamsearch-history', JSON.stringify(next));
  };

  const runSearch = async (value = query) => {
    if (!value.trim() || loading) {
      return;
    }

    setLoading(true);
    setCopiedLink(null);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: value })
      });

      if (!response.ok) {
        throw new Error('Не удалось выполнить поиск');
      }

      const data = (await response.json()) as SearchResponse;
      setResult(data);
      saveHistory(value);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedLink(link);
  };

  return (
    <main>
      <h1>SteamSearch</h1>
      <p className="subtitle">Найдите игру в Steam по названию или по смысловому описанию.</p>

      <section className="search-panel">
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void runSearch();
            }
          }}
          placeholder='Введите название игры или опишите её (например: "шутер про парня с татуировкой" или "игра где надо чинить радиостанцию в лесу")'
        />
        <button className="primary" onClick={() => void runSearch()} disabled={loading}>
          {loading ? 'Ищем…' : 'Найти игру в Steam'}
        </button>
        <div className="hints">Например: "{randomHint}"</div>
      </section>

      {history.length > 0 && (
        <section className="history">
          <strong>Последние запросы:</strong>
          <div className="actions" style={{ marginTop: '0.6rem' }}>
            {history.map((item) => (
              <button key={item} className="secondary" onClick={() => void runSearch(item)}>
                {item}
              </button>
            ))}
          </div>
        </section>
      )}

      {loading && <div className="spinner" aria-label="Загрузка" />}
      {error && <p>{error}</p>}

      {result?.mode === 'description' && result.resolvedTitle && (
        <p className="subtitle" style={{ marginTop: '1rem', marginBottom: 0 }}>
          Семантический режим предположил: <strong>{result.resolvedTitle}</strong>
        </p>
      )}

      {result?.status === 'single' && result.results[0] && (
        <section className="result">
          <h3>Найдена игра</h3>
          <div className="card-grid">
            <article className="card">
              {result.results[0].tiny_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.results[0].tiny_image} alt={result.results[0].name} />
              )}
              <div className="card-body">
                <strong>{result.results[0].name}</strong>
                <div className="actions" style={{ marginTop: '0.6rem' }}>
                  <a href={result.results[0].link} target="_blank" rel="noreferrer" className="btn-link primary">
                    Открыть в Steam
                  </a>
                  <button className="secondary" onClick={() => void copy(result.results[0].link)}>
                    {copiedLink === result.results[0].link ? 'Скопировано' : 'Скопировать ссылку'}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {result?.status === 'multiple' && (
        <section className="card-list">
          <h3>Возможно, вы имели в виду одну из этих игр?</h3>
          <div className="card-grid">
            {result.results.slice(0, 5).map((game) => (
              <article className="card" key={game.appid}>
                {game.tiny_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.tiny_image} alt={game.name} />
                )}
                <div className="card-body">
                  <strong>{game.name}</strong>
                  <div className="actions" style={{ marginTop: '0.6rem' }}>
                    <a href={game.link} target="_blank" rel="noreferrer" className="btn-link primary">
                      Открыть в Steam
                    </a>
                    <button className="secondary" onClick={() => void copy(game.link)}>
                      {copiedLink === game.link ? 'Скопировано' : 'Скопировать'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {result?.status === 'none' && (
        <section className="popular">
          <h3>Ничего не найдено. Попробуйте уточнить запрос.</h3>
          <p>Сейчас популярно в Steam:</p>
          <div className="card-grid">
            {result.popular.slice(0, 5).map((game) => (
              <article className="card" key={game.appid}>
                {game.tiny_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.tiny_image} alt={game.name} />
                )}
                <div className="card-body">
                  <strong>{game.name}</strong>
                  <div className="actions" style={{ marginTop: '0.6rem' }}>
                    <a href={game.link} target="_blank" rel="noreferrer" className="btn-link primary">
                      Открыть в Steam
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <p className="footer-note">
        SteamSearch не является официальным продуктом Valve Corporation. Все товарные знаки являются
        собственностью соответствующих владельцев. Ссылки ведут на официальный сайт Steam.
      </p>
    </main>
  );
}
