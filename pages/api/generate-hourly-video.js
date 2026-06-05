import { getTopClips } from '../../lib/twitch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { query, body } = req;
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const mcpBase = process.env.VIDEO_MCP_BASE_URL;
    const mcpApiKey = process.env.VIDEO_MCP_API_KEY;

    const limit = 5;
    const periodMinutes = parseInt(
      process.env.PERIOD_MINUTES || body?.periodMinutes || query.periodMinutes || '60',
      10,
    );
    const game_id = body?.game_id || query.game_id || process.env.TOP_GAME_ID;
    const broadcaster_id = body?.broadcaster_id || query.broadcaster_id || process.env.TOP_BROADCASTER_ID;
    const gameName = body?.game_name || query.game_name || process.env.GAME_NAME || 'the internet';

    if (!clientId || !clientSecret) {
      res.status(400).json({ error: 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set in env' });
      return;
    }
    if (!mcpBase) {
      res.status(400).json({ error: 'VIDEO_MCP_BASE_URL must be set in env' });
      return;
    }
    if (!game_id && !broadcaster_id) {
      res.status(400).json({ error: 'Provide `game_id` or set TOP_GAME_ID / TOP_BROADCASTER_ID in env' });
      return;
    }

    const clips = await getTopClips({
      clientId,
      clientSecret,
      game_id,
      broadcaster_id,
      limit,
      periodMinutes,
    });

    if (!clips.length) {
      res.status(404).json({ error: 'No clips found for the requested window' });
      return;
    }

    const clipSources = clips.map((clip, index) => ({
      title: clip.title || `Clip ${index + 1}`,
      broadcaster_name: clip.broadcaster_name,
      source_url: clip.source_url,
      voice_text: `Here's a clip from ${clip.broadcaster_name}`,
    }));

    const payload = {
      job_type: 'tiktok-hourly-dose',
      aspect_ratio: '9:16',
      max_clips: clipSources.length,
      intro_text: `Here is your hourly dose of ${gameName}`,
      clips: clipSources,
      output_filename: `hourly-dose-${gameName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp4`,
      metadata: {
        game_id,
        broadcaster_id,
        period_minutes: periodMinutes,
      },
    };

    const renderUrl = `${mcpBase.replace(/\/$/, '')}/render`;
    const renderRes = await fetch(renderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(mcpApiKey ? { Authorization: `Bearer ${mcpApiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!renderRes.ok) {
      const errorText = await renderRes.text();
      res.status(502).json({ error: 'Video MCP server error', details: errorText });
      return;
    }

    const result = await renderRes.json();
    res.status(200).json({ clips, job: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
