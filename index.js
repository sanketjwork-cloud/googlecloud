import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ---- Keyword Set (Phase 1 – FIXED) ----
const DISCOVERY_KEYWORD = "funny baby";

const CORE_KEYWORDS = [
  "sarcastic baby",
  "baby inner thoughts",
  "baby judging parents",
  "baby with adult voice",
  "baby POV comedy"
];

// ---- Health Check ----
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "YouTube Keyword Search Agent running 🚀",
    generatedAt: new Date().toISOString()
  });
});

// ---- Keyword Search Endpoint ----
app.get("/search", async (req, res) => {
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: "Missing YOUTUBE_API_KEY" });
  }

  try {
    const results = [];

    // We deliberately limit calls (free tier safe)
    const keywordsToTest = [DISCOVERY_KEYWORD, ...CORE_KEYWORDS];

    for (const keyword of keywordsToTest) {
      const searchUrl =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(keyword)}` +
        `&key=${YOUTUBE_API_KEY}`;

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.items) continue;

      for (const item of searchData.items) {
        const videoId = item.id.videoId;

        const statsUrl =
          `https://www.googleapis.com/youtube/v3/videos` +
          `?part=statistics,contentDetails&id=${videoId}` +
          `&key=${YOUTUBE_API_KEY}`;

        const statsRes = await fetch(statsUrl);
        const statsData = await statsRes.json();

        if (!statsData.items || !statsData.items.length) continue;

        const video = statsData.items[0];
        const views = parseInt(video.statistics.viewCount || "0", 10);

        // Only videos that prove demand
        if (views >= 100000) {
          results.push({
            keyword,
            videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            views,
            publishedAt: item.snippet.publishedAt
          });
        }
      }
    }

    res.json({
      generatedAt: new Date().toISOString(),
      keywordsTested: keywordsToTest,
      count: results.length,
      videos: results
    });

  } catch (error) {
    res.status(500).json({
      error: "Search failed",
      details: error.message
    });
  }
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
