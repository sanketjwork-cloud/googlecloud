import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

// Immediate listen — Cloud Run health check
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/") {
    return res.end(
      JSON.stringify({
        status: "ok",
        message: "Sarcastic Baby AI Agent running 🚀",
        generatedAt: new Date().toISOString()
      })
    );
  }

  if (url.pathname === "/shorts") {
    if (!API_KEY) {
      return res.end(JSON.stringify({ error: "Missing YOUTUBE_API_KEY" }));
    }

    try {
      // Only make API calls when request comes in
      const keywords = [
        "funny baby",              // discovery
        "sarcastic baby",          // core 1
        "baby inner thoughts",     // core 2
        "baby judging parents"     // core 3
      ];

      const results = [];

      // Loop over keywords one by one (free tier safe)
      for (const keyword of keywords) {
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(keyword)}&key=${API_KEY}`
        ).then(r => r.json());

        if (!searchRes.items) continue;

        for (const item of searchRes.items) {
          const videoId = item.id.videoId;
          const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`
          ).then(r => r.json());

          const video = statsRes.items?.[0];
          const views = parseInt(video?.statistics?.viewCount || "0", 10);

          if (views >= 100000) {
            results.push({
              keyword,
              videoId,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              durationSec: 0,
              views,
              publishedAt: item.snippet.publishedAt,
              hashtags: []
            });
          }
        }
      }

      res.end(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          keywordUsed: keywords[0],
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

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
