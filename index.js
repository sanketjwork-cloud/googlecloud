import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

console.log("🚀 Booting YouTube AI Agent...");
console.log("PORT:", PORT);
console.log("API KEY present:", Boolean(API_KEY));

// Real channels to track
const CHANNEL_IDS = [
  "UCYOFR8S4AU2UbEyhoPvEFiA", // Ai baby trends
  "UCUEGP4m4tQi-aWJ2G1npNcg", // Cute Baby
  "UCqoP7gx5GR9SxbiDfXNn1qA", // Baby dance
  "UCPEFJosRQkA8SmWBIGUlP_A"  // Healing Dreams
];

// Convert ISO 8601 duration to seconds
function parseDurationToSeconds(duration) {
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const minutes = parseInt(match[1] || "0", 10);
  const seconds = parseInt(match[2] || "0", 10);
  return minutes * 60 + seconds;
}

// Fetch Shorts-only videos from channels
async function fetchShortsOnly() {
  if (!API_KEY) {
    console.error("❌ YOUTUBE_API_KEY missing");
    return [];
  }

  try {
    let allVideos = [];

    for (const channelId of CHANNEL_IDS) {
      // Search latest 50 videos from channel
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channelId}&maxResults=50&order=date&key=${API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      if (!searchData.items) continue;

      const videoIds = searchData.items.map(v => v.id.videoId).join(",");
      if (!videoIds) continue;

      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${API_KEY}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      if (!detailsData.items) continue;

      // Filter Shorts (≤60 seconds)
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

      allVideos = allVideos.concat(shorts);
    }

    // Dummy fallback if no Shorts found
    if (allVideos.length === 0) {
      allVideos = [
        { videoId: "dummy1", title: "Test Short 1", channel: "Ai baby trends", durationSec: 30, views: 1200, publishedAt: new Date().toISOString() },
        { videoId: "dummy2", title: "Test Short 2", channel: "Cute Baby", durationSec: 45, views: 800, publishedAt: new Date().toISOString() }
      ];
    }

    return allVideos;
  } catch (err) {
    console.error("🔥 Shorts fetch failed:", err.message);
    return [
      { videoId: "dummy1", title: "Test Short 1", channel: "Ai baby trends", durationSec: 30, views: 1200, publishedAt: new Date().toISOString() }
    ];
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Root health check
  if (url.pathname === "/") {
    return res.end(
      JSON.stringify({
        status: "ok",
        message: "YouTube AI Agent is running 🚀",
        generatedAt: new Date().toISOString()
      })
    );
  }

  // Shorts endpoint
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
