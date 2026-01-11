import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

console.log("🚀 Booting Sarcastic Baby AI Agent...");
console.log("PORT:", PORT);
console.log("API KEY present:", Boolean(API_KEY));

const DISCOVERY_KEYWORD = "funny baby";
const CORE_KEYWORDS = [
  "sarcastic baby",
  "baby inner thoughts",
  "baby judging parents"
];

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Root health check
  if (url.pathname === "/") {
    return res.end(
      JSON.stringify({
        status: "ok",
        message: "Sarcastic Baby AI Agent is running 🚀",
        generatedAt: new Date().toISOString()
      })
    );
  }

  // Shorts endpoint with keyword search
  if (url.pathname === "/shorts") {
    if (!API_KEY) {
      return res.end(JSON.stringify({ error: "Missing YOUTUBE_API_KEY" }));
    }

    try {
      const results = [];

      // Loop over keywords one by one (sequentially to avoid free tier limits)
      for (const keyword of [DISCOVERY_KEYWORD, ...CORE_KEYWORDS]) {
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(
            keyword
          )}&key=${API_KEY}`
        ).then(r => r.json());

        if (!searchRes.items) continue;

        for (const item of searchRes.items) {
          const videoId = item.id.videoId;

          const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`
          ).then(r => r.json());

          const video = statsRes.items?.[0];
          const views = parseInt(video?.statistics?.viewCount || "0", 10);

          // Only include videos over 100k views
          if (views >= 100000) {
            results.push({
              keyword,
              videoId,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              durationSec: 0, // optional: you can fetch duration if needed
              views,
              publishedAt: item.snippet.publishedAt,
              hashtags: [] // optional: parse from description if needed
            });
          }
        }
      }

      res.end(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          keywordUsed: DISCOVERY_KEYWORD,
          count: results.length,
          shorts: results
        })
      );
    } catch (err) {
      res.end(JSON.stringify({ error: err.message }));
    }

    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

// Listen immediately to satisfy Cloud Run
server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
