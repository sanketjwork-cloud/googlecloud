import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  throw new Error("Missing YOUTUBE_API_KEY");
}

const KEYWORDS = [
  "baby",
  "cute baby",
  "baby laughing",
  "baby dance",
  "ai baby",
  "baby animation"
];

const MIN_VIEWS = 100_000;
const MAX_DURATION_SEC = 15;
const MAX_RESULTS = 50;

const isoDurationToSeconds = (iso) => {
  const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const min = parseInt(match?.[1] || 0);
  const sec = parseInt(match?.[2] || 0);
  return min * 60 + sec;
};

const daysSince = (publishedAt) => {
  const published = new Date(publishedAt);
  const now = new Date();
  const diffMs = now - published;
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const extractHashtags = (text = "") =>
  [...text.matchAll(/#\w+/g)].map(m => m[0]);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "YouTube AI Agent is running 🚀",
    generatedAt: new Date().toISOString()
  });
});

app.get("/shorts", async (req, res) => {
  try {
    let allVideos = [];

    for (const keyword of KEYWORDS) {
      const searchUrl =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet&type=video&maxResults=${MAX_RESULTS}` +
        `&q=${encodeURIComponent(keyword)}` +
        `&key=${API_KEY}`;

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.items) continue;

      const videoIds = searchData.items.map(v => v.id.videoId).join(",");

      const detailsUrl =
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=contentDetails,statistics,snippet&id=${videoIds}` +
        `&key=${API_KEY}`;

      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();

      if (!detailsData.items) continue;

      for (const video of detailsData.items) {
        const durationSec = isoDurationToSeconds(video.contentDetails.duration);
        const views = Number(video.statistics.viewCount || 0);

        if (durationSec > MAX_DURATION_SEC) continue;
        if (views < MIN_VIEWS) continue;

        const ageInDays = daysSince(video.snippet.publishedAt);
        const trendScore = Math.round(views / ageInDays);

        allVideos.push({
          videoId: video.id,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          keyword,
          durationSec,
          views,
          ageInDays,
          trendScore,
          publishedAt: video.snippet.publishedAt,
          hashtags: extractHashtags(video.snippet.description)
        });
      }
    }

    // 🔥 Sort by Trend Score (highest first)
    allVideos.sort((a, b) => b.trendScore - a.trendScore);

    res.json({
      generatedAt: new Date().toISOString(),
      count: allVideos.length,
      shorts: allVideos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
