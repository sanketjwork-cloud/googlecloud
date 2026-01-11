import express from "express";
import fetch from "node-fetch";

const app = express();

// ✅ CRITICAL: Cloud Run injects PORT
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "YouTube AI Agent is running 🚀",
    generatedAt: new Date().toISOString()
  });
});

app.get("/shorts", async (req, res) => {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      throw new Error("Missing YOUTUBE_API_KEY env variable");
    }

    const query = req.query.q || "AI baby cute";
    const maxResults = 25;

    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&type=video` +
      `&videoDuration=short` +
      `&order=viewCount` +
      `&q=${encodeURIComponent(query)}` +
      `&maxResults=${maxResults}` +
      `&key=${API_KEY}`;

    const r = await fetch(url);
    const d = await r.json();

    const shorts = (d.items || []).map(v => ({
      videoId: v.id.videoId,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
      videoUrl: `https://youtube.com/shorts/${v.id.videoId}`
    }));

    res.json({
      generatedAt: new Date().toISOString(),
      keyword: query,
      count: shorts.length,
      shorts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 THIS LINE IS WHAT CLOUD RUN NEEDS
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
