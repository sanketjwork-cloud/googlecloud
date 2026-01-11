import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error("❌ YOUTUBE_API_KEY not set");
}

const KEYWORDS = [
  "baby",
  "cute baby",
  "funny baby",
  "AI baby",
  "baby viral"
];

// ---- Helpers ----
function parseISODurationToSeconds(iso) {
  const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const minutes = parseInt(match[1] || "0", 10);
  const seconds = parseInt(match[2] || "0", 10);
  return minutes * 60 + seconds;
}

// ---- Server ----
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === "/") {
    return res.end(
      JSON.stringify({
        status: "ok",
        message: "YouTube AI Agent is running 🚀",
        generatedAt: new Date().toISOString()
      })
    );
  }

  // Shorts-style trending baby videos
  if (url.pathname === "/shorts") {
    try {
      let collected = [];

      for (const keyword of KEYWORDS) {
        const searchUrl =
          `https://www.googleapis.com/youtube/v3/search` +
          `?part=snippet` +
          `&q=${encodeURIComponent(keyword)}` +
          `&type=video` +
          `&videoDuration=short` +
          `&order=viewCount` +
          `&maxResults=10` +
          `&key=${API_KEY}`;

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.items) continue;

        const videoIds = searchData.items
          .map(v => v.id.videoId)
          .filter(Boolean)
          .join(",");

        if (!videoIds) continue;

        const detailsUrl =
          `https://www.googleapis.com/youtube/v3/videos` +
          `?part=contentDetails,statistics,snippet` +
          `&id=${videoIds}` +
          `&key=${API_KEY}`;

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (!detailsData.items) continue;

        for (const video of detailsData.items) {
          const durationSec = parseISODurationToSeconds(
            video.contentDetails.duration
          );
          const views = Number(video.statistics.viewCount || 0);

          // FINAL FILTERS
          if (durationSec <= 15 && views >= 100000) {
            collected.push({
              videoId: video.id,
              title: video.snippet.title,
              channel: video.snippet.channelTitle,
              durationSec,
              views,
              publishedAt: video.snippet.publishedAt,
              description: video.snippet.description
            });
          }
        }
      }

      return res.end(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          count: collected.length,
          shorts: collected
        })
      );
    } catch (err) {
      console.error("❌ Error fetching videos:", err);
      res.statusCode = 500;
      return res.end(
        JSON.stringify({
          error: "Failed to fetch trending baby videos"
        })
      );
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
