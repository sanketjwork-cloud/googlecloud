import http from "http";
import { URL } from "url";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY || "";

console.log("🚀 Booting YouTube Trend Agent");
console.log("PORT:", PORT);
console.log("API KEY present:", Boolean(API_KEY));

const KEYWORDS = [
  "baby",
  "cute baby",
  "baby laugh",
  "ai baby",
  "baby dance"
];

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 🔹 Health check
  if (url.pathname === "/") {
    return res.end(JSON.stringify({
      status: "ok",
      message: "YouTube AI Agent is running 🚀",
      generatedAt: new Date().toISOString()
    }));
  }

  // 🔹 Shorts discovery
  if (url.pathname === "/shorts") {
    if (!API_KEY) {
      return res.end(JSON.stringify({
        error: "Missing YOUTUBE_API_KEY",
        count: 0,
        shorts: []
      }));
    }

    try {
      const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];

      const searchUrl =
        "https://www.googleapis.com/youtube/v3/search" +
        `?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(keyword)}` +
        `&order=viewCount&key=${API_KEY}`;

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.items) {
        throw new Error("No items returned");
      }

      const videoIds = searchData.items.map(v => v.id.videoId).join(",");

      const detailsUrl =
        "https://www.googleapis.com/youtube/v3/videos" +
        `?part=snippet,statistics,contentDetails&id=${videoIds}` +
        `&key=${API_KEY}`;

      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();

      const shorts = detailsData.items
        .map(v => {
          const duration = v.contentDetails.duration;
          const seconds =
            parseInt(duration.match(/(\d+)S/)?.[1] || 0) +
            (parseInt(duration.match(/(\d+)M/)?.[1] || 0) * 60);

          return {
            videoId: v.id,
            title: v.snippet.title,
            channel: v.snippet.channelTitle,
            views: Number(v.statistics.viewCount || 0),
            durationSec: seconds,
            publishedAt: v.snippet.publishedAt,
            trendScore: Math.round(
              (Number(v.statistics.viewCount || 0) / Math.max(seconds, 1)) / 1000
            )
          };
        })
        .filter(v => v.durationSec <= 15 && v.views >= 100000)
        .sort((a, b) => b.trendScore - a.trendScore);

      return res.end(JSON.stringify({
        generatedAt: new Date().toISOString(),
        keywordUsed: keyword,
        count: shorts.length,
        shorts
      }));

    } catch (err) {
      console.error("❌ Shorts error:", err.message);
      return res.end(JSON.stringify({
        error: "Failed to fetch shorts",
        count: 0,
        shorts: []
      }));
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
