async function getAppAccessToken(clientId, clientSecret) {
  const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;
  const res = await fetch(tokenUrl, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to get Twitch access token');
  const json = await res.json();
  return json.access_token;
}

export default async function handler(req, res) {
  try {
    const { query } = req;
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const periodMinutes = parseInt(process.env.PERIOD_MINUTES || query.periodMinutes || '60', 10);

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const fallbackGame = process.env.TOP_GAME_ID;
    const fallbackBroadcaster = process.env.TOP_BROADCASTER_ID;

    if (!clientId || !clientSecret) {
      res.status(400).json({ error: 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set in env' });
      return;
    }

    const game_id = query.game_id || fallbackGame;
    const broadcaster_id = query.broadcaster_id || fallbackBroadcaster;
    if (!game_id && !broadcaster_id) {
      res.status(400).json({ error: 'Provide `game_id` or set TOP_GAME_ID / broadcaster_id / TOP_BROADCASTER_ID in env' });
      return;
    }

    const token = await getAppAccessToken(clientId, clientSecret);

    const startedAt = new Date(Date.now() - periodMinutes * 60 * 1000).toISOString();

    const params = new URLSearchParams();
    params.set('started_at', startedAt);
    params.set('first', String(limit));
    if (game_id) params.set('game_id', game_id);
    if (broadcaster_id) params.set('broadcaster_id', broadcaster_id);

    const url = `https://api.twitch.tv/helix/clips?${params.toString()}`;
    const clipsRes = await fetch(url, {
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!clipsRes.ok) {
      const text = await clipsRes.text();
      res.status(500).json({ error: 'Twitch API error', details: text });
      return;
    }

    const data = await clipsRes.json();
    const clips = (data.data || []).map((c) => ({
      id: c.id,
      url: c.url,
      embed_url: c.embed_url,
      title: c.title,
      creator_name: c.creator_name,
      broadcaster_name: c.broadcaster_name,
      thumbnail_url: c.thumbnail_url,
      view_count: c.view_count,
      created_at: c.created_at,
    }));

    res.status(200).json({ clips });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
