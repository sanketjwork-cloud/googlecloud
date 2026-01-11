import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ---- Health Check ----
app.get("/", (req, res) => {
  res.json({ status: "ok", generatedAt: new Date().toISOString() });
});

// ---- Search Endpoint ----
app.get("/search", async (req, res) => {
  if (!YOUTUBE_API_KEY) return res.status(500).json({ error: "Missing YOUTUBE_API_KEY" });

  try {
    const DISCOVERY_KEYWORD = "funny baby";
    const CORE_KEYWORDS = [
      "sarcastic baby",
      "baby inner thoughts",
      "baby judging parents",
      "baby with adult voice",
      "baby POV comedy"
    ];

    const results = [];

    for (const keyword of [DISCOVERY_KEYWORD, ...CORE_KEYWORDS]) {
      const searchData = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
          keyword
        )}&key=${YOUTUBE_API_KEY}`
      ).then((r) => r.json());

      if (!searchData.items) continue;

      for (const item of searchData.items) {
        const videoId = item.id.videoId;
        const statsData = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
        ).then((r) => r.json());

        const video = statsData.items?.[0];
        const views = parseInt(video?.statistics?.viewCount || "0", 10);

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

    res.json({ generatedAt: new Date().toISOString(), count: results.length, videos: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Listen immediately ----
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
