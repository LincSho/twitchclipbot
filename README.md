# Twitch Recent Top Clips (minimal Next.js)

Minimal Next.js app that fetches recent top clips from Twitch using the Helix API. The server route queries clips created within the last configurable time window.

Setup

1. Copy environment variables into `.env.local` (or export in your environment):

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
# optional: TOP_GAME_ID or TOP_BROADCASTER_ID
PERIOD_MINUTES=60
VIDEO_MCP_BASE_URL=https://your-video-mcp-server.example.com
VIDEO_MCP_API_KEY=your_api_key_here
# optional friendly name used in intro voiceover
# GAME_NAME=Valorant
```

2. Install and run locally:

```bash
npm install
npm run dev
```

Usage

- Open `http://localhost:3000` and optionally provide a `Game ID`, `Game Name`, or adjust period/limit and click Refresh.
- If `Game ID` is not provided, the app will try to resolve `Game Name` to a Twitch game ID automatically.
- Click `Generate TikTok Video` to submit a stitched hourly video job to the configured Video MCP server.
- The generated job payload includes a 9:16 output, an AI intro voice line like "Here is your hourly dose of Valorant", and an interstitial prompt before each clip like "Here's a clip from <channel name>".
- The server route is `GET /api/top-clips` and returns the top clips from the past hour, sorted by view count.
- The job route is `POST /api/generate-hourly-video` and accepts query params or JSON body fields `game_id`, `broadcaster_id`, `game_name`, `periodMinutes`.

Example JSON body for `/api/generate-hourly-video`:

```json
{
  "game_name": "Valorant",
  "periodMinutes": 60,
  "game_id": "123456"
}
```

Notes

- You must register a Twitch app to obtain `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`: https://dev.twitch.tv/console/apps
- The Helix `Get Clips` endpoint requires at least `game_id` or `broadcaster_id`; the app will use `TOP_GAME_ID` or `TOP_BROADCASTER_ID` from env if not provided from the client.
