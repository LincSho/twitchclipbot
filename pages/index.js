import { useEffect, useState } from 'react';

export default function Home() {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateMessage, setGenerateMessage] = useState('');
  const [generateResult, setGenerateResult] = useState(null);
  const [period, setPeriod] = useState(60);
  const [limit, setLimit] = useState(5);
  const [gameId, setGameId] = useState('');
  const [gameName, setGameName] = useState('Valorant');

  useEffect(() => {
    fetchClips();
  }, []);

  async function fetchClips() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('periodMinutes', String(period));
      q.set('limit', String(limit));
      if (gameId) q.set('game_id', gameId);
      const res = await fetch(`/api/top-clips?${q.toString()}`);
      const json = await res.json();
      setClips(json.clips || []);
    } catch (err) {
      console.error(err);
      setClips([]);
    } finally {
      setLoading(false);
    }
  }

  async function generateVideo() {
    setGenerateLoading(true);
    setGenerateMessage('Requesting hourly TikTok video...');
    setGenerateResult(null);

    try {
      const q = new URLSearchParams();
      q.set('periodMinutes', String(period));
      q.set('game_name', gameName);
      if (gameId) q.set('game_id', gameId);

      const res = await fetch(`/api/generate-hourly-video?${q.toString()}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Unknown error');
      }
      setGenerateResult(json);
      setGenerateMessage('Video generation request submitted. Check the job response below.');
    } catch (err) {
      console.error(err);
      setGenerateMessage(`Failed to generate video: ${err.message}`);
    } finally {
      setGenerateLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto', padding: 20 }}>
      <h1>Twitch — Recent Top Clips</h1>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Period (minutes):</label>
        <input value={period} onChange={(e) => setPeriod(Number(e.target.value))} style={{ width: 80, marginRight: 12 }} />
        <label style={{ marginRight: 8 }}>Limit:</label>
        <input value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ width: 80, marginRight: 12 }} />
        <label style={{ marginRight: 8 }}>Game ID (optional):</label>
        <input value={gameId} onChange={(e) => setGameId(e.target.value)} style={{ width: 180, marginRight: 12 }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Game Name:</label>
        <input value={gameName} onChange={(e) => setGameName(e.target.value)} style={{ width: 180, marginRight: 12 }} />
        <button onClick={fetchClips} style={{ marginRight: 10 }}>Refresh Clips</button>
        <button onClick={generateVideo} disabled={generateLoading || loading}>{generateLoading ? 'Generating video...' : 'Generate TikTok Video'}</button>
      </div>

      {loading && <div>Loading clips...</div>}
      {generateMessage && <div style={{ margin: '8px 0', color: '#333' }}>{generateMessage}</div>}
      {generateResult?.job && (
        <div style={{ marginBottom: 12, padding: 10, background: '#f8f8f8', borderRadius: 8 }}>
          <div><strong>Video job submitted.</strong></div>
          <div>Job response: {JSON.stringify(generateResult.job)}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {clips.map((c) => (
          <a key={c.id} href={c.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            <img src={c.thumbnail_url} alt={c.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
            <div style={{ padding: 8 }}>
              <div style={{ fontWeight: 600 }}>{c.title || 'Clip'}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{c.broadcaster_name} • {c.creator_name}</div>
              <div style={{ fontSize: 12, color: '#777' }}>{c.view_count} views • {new Date(c.created_at).toLocaleString()}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
