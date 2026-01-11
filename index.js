import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

const KEYWORDS = [
  "baby",
  "cute baby",
  "baby laughing",
  "ai baby",
  "baby animation",
  "baby dance"
];

console.log("🚀 YouTube Trend Agent starting...");
console.log("API key present:", Boolean(API_KEY));

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

  // MAIN endpoint
  if (url.pathname === "/shorts") {
    if (!API_KEY) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "Missing YOUTUBE_API_KEY" }));
    }

    try {
      const results = [];

      for (const keyword of KEYWORDS) {
        const searchUrl =
          `https://www.googleapis.com/youtube/v3/search` +
          `?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
            keyword
          )}&key=${API_KEY}`;

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.items) continue;

        for (const item of searchData.items) {
          const videoId = item.id.videoId;

          const videoUrl =
            `https://www.googleapis.com/youtube/v3/videos` +
            `?part=contentDetails,statistics,snippet&id=${videoId}&key=${API_KEY}`;

          const videoRes = await fetch(videoUrl);
          const videoData = await videoRes.json();

          if (!videoData.items || !videoData.items[0]) continue;

          const video = videoData.items[0];

          // Duration (ISO 8601 → seconds)
          const match = video.contentDetails.duration.match(
            /PT(?:(\d+)M)?(?:(\d+)S)?/
          );
          const minutes = parseInt(match?.[1] || "0", 10);
          const seconds = parseInt(match?.[2] || "0", 10);
          const durationSec = minutes * 60 + seconds;

          const views = parseInt(video.statistics.viewCount || "0", 10);

          // 🔥 CORE FILTERS
          if (durationSec > 45) continue;
          if (views < 100000) continue;

          // Hashtag extraction
          const description = video.snippet.description || "";
          const hashtags =
            description.match(/#[a-zA-Z0-9_]+/g) || [];

          results.push({
            videoId,
            title: video.snippet.title,
            channel: video.snippet.channelTitle,
            keyword,
            durationSec,
            views,
            publishedAt: video.snippet.publishedAt,
            hashtags
          });
        }
      }

      return res.end(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          count: results.length,
          shorts: results
        })
      );
    } catch (err) {
      console.error("Fetch error:", err);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "Failed to fetch videos" }));
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
