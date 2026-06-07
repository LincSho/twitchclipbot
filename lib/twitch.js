async function getAppAccessToken(clientId, clientSecret) {
  const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;
  const res = await fetch(tokenUrl, { method: 'POST' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get Twitch access token: ${text}`);
  }

  const json = await res.json();
  return json.access_token;
}

function clipMp4Url(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  return thumbnailUrl.replace(/-preview-.*\.jpg$/, '.mp4');
}

async function getGameIdByName(clientId, clientSecret, name) {
  if (!name) return null;
  const token = await getAppAccessToken(clientId, clientSecret);

  const gameUrl = `https://api.twitch.tv/helix/games?name=${encodeURIComponent(name)}`;
  const gameRes = await fetch(gameUrl, {
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!gameRes.ok) {
    const text = await gameRes.text();
    throw new Error(`Twitch game lookup error: ${text}`);
  }

  const gameData = await gameRes.json();
  if (gameData.data && gameData.data.length) {
    return gameData.data[0].id;
  }

  const searchUrl = `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(name)}`;
  const searchRes = await fetch(searchUrl, {
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!searchRes.ok) {
    const text = await searchRes.text();
    throw new Error(`Twitch game search error: ${text}`);
  }

  const searchData = await searchRes.json();
  return searchData.data && searchData.data.length ? searchData.data[0].id : null;
}

async function resolveGameId({ clientId, clientSecret, game_id, game_name }) {
  if (game_id) return game_id;
  if (!game_name) return null;
  return getGameIdByName(clientId, clientSecret, game_name);
}

export async function getTopClips({ clientId, clientSecret, game_id, game_name, broadcaster_id, limit = 5, periodMinutes = 60 }) {
  const token = await getAppAccessToken(clientId, clientSecret);
  const resolvedGameId = await resolveGameId({ clientId, clientSecret, game_id, game_name });
  const startedAt = new Date(Date.now() - periodMinutes * 60 * 1000).toISOString();

  const fetchLimit = 100;
  const params = new URLSearchParams();
  params.set('started_at', startedAt);
  params.set('first', String(fetchLimit));
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
    throw new Error(`Twitch API error: ${text}`);
  }

  const data = await clipsRes.json();
  const allClips = (data.data || []).map((c) => ({
    id: c.id,
    url: c.url,
    embed_url: c.embed_url,
    title: c.title,
    creator_name: c.creator_name,
    broadcaster_name: c.broadcaster_name,
    thumbnail_url: c.thumbnail_url,
    source_url: clipMp4Url(c.thumbnail_url) || c.url,
    view_count: c.view_count,
    created_at: c.created_at,
  }));

  return allClips
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, limit);
}
