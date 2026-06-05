# Twitch Recent Top Clips (minimal Next.js)

Minimal Next.js app that fetches recent top clips from Twitch using the Helix API. The server route queries clips created within the last configurable time window.

Setup

1. Copy environment variables into `.env.local` (or export in your environment):

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
# optional: TOP_GAME_ID or TOP_BROADCASTER_ID
PERIOD_MINUTES=60
```

2. Install and run locally:

```bash
npm install
npm run dev
```

Usage

- Open `http://localhost:3000` and optionally provide a `Game ID` or adjust period/limit and click Refresh.
- The server route is `GET /api/top-clips` and accepts query params `game_id`, `broadcaster_id`, `limit`, `periodMinutes`.

Notes

- You must register a Twitch app to obtain `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`: https://dev.twitch.tv/console/apps
- The Helix `Get Clips` endpoint requires at least `game_id` or `broadcaster_id`; the app will use `TOP_GAME_ID` or `TOP_BROADCASTER_ID` from env if not provided from the client.
