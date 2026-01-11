import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

console.log("🚀 Booting YouTube AI Agent...");
console.log("PORT:", PORT);
console.log("API KEY present:", Boolean(API_KEY));

function parseDurationToSeconds(duration) {
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const minutes = parseInt(match[1] || "0", 10);
  const seconds = parseInt(match[2] || "0", 10);
  return minutes * 60 + seconds;
}

async function fetchShortsOnly() {
  if (!API_KEY) return [];

  try {
    // 1️⃣ Search videos
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&maxResults=10&q=shorts&key=${API_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items) return [];

    const videoIds = searchData.items.map(v => v.id.videoId).join(",");

    // 2️⃣ Fetch video details
    const detailsUrl =
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics,snippet&id=${videoIds}&key=${API_KEY}`;

    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (!detailsData.items) return [];

    // 3️⃣ Filter Shorts (≤ 60s)
    const shorts = detailsData.items
      .map(video => {
        const durationSec = parseDurationToSeconds(video.contentDetails.duration);

        return {
          videoId: video.id,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          durationSec,
          views: Number(video.statistics.viewCount || 0),
          publishedAt: video.snippet.publishedAt
        };
      })
      .filter(v => v.durationSec > 0 && v.durationSec <= 60);

    return shorts;
  } catch (err) {
    console.error("🔥 Shorts fetch failed:", err.message);
    return [];
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/") {
    return res.end(
      JSON.stringify({
        status: "ok",
        message: "YouTube AI Agent is running 🚀",
        generatedAt: new Date().toISOString()
      })
    );
  }

  if (url.pathname === "/shorts") {
    const shorts = await fetchShortsOnly();

    return res.end(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        count: shorts.length,
        shorts
      })
    );
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
