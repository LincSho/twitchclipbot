import { getTopClips } from '../../lib/twitch';

export default async function handler(req, res) {
  try {
    const { query } = req;
    const limit = Math.min(parseInt(query.limit || '5', 10), 100);
    const periodMinutes = parseInt(process.env.PERIOD_MINUTES || query.periodMinutes || '60', 10);

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const fallbackGame = process.env.TOP_GAME_ID;
    const fallbackBroadcaster = process.env.TOP_BROADCASTER_ID;

    const game_id = query.game_id || fallbackGame;
    const broadcaster_id = query.broadcaster_id || fallbackBroadcaster;
    if (!clientId || !clientSecret) {
      res.status(400).json({ error: 'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set in env' });
      return;
    }
    if (!game_id && !broadcaster_id) {
      res.status(400).json({ error: 'Provide `game_id` or set TOP_GAME_ID / broadcaster_id / TOP_BROADCASTER_ID in env' });
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

    res.status(200).json({ clips });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
