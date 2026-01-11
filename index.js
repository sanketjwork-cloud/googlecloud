import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

console.log("🚀 Booting YouTube AI Agent...");
console.log("PORT:", PORT);
console.log("API KEY present:", Boolean(API_KEY));

// Keywords to search for trending Shorts
const SEARCH_KEYWORDS = ["baby shorts", "AI baby", "cute baby", "baby dance"];

// Convert ISO 8601 duration to seconds
function parseDurationToSeconds(duration) {
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const minutes = parseInt(match[1] || "0", 10);
  const seconds = parseInt(match[2] || "0", 10);
  return minutes * 60 + seconds;
}

// Fetch Shorts using keyword search (≤15s)
async function fetchShortsByKeyword() {
  if (!API_KEY) {
    console.error("❌ YOUTUBE_API_KEY missing");
    return [];
  }

  let allVideos = [];

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      // Search latest videos for keyword
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
        keyword
      )}&maxResults=50&order=date&key=${API_KEY}`;

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      if (!searchData.items) continue;

      const videoIds = searchData.items.map(v => v.id.videoId).join(",");
      if (!videoIds) continue;

      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${API_KEY}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      if (!detailsData.items) continue;

      // Filter Shorts ≤ 15 seconds
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
        .filter(v => v.durationSec > 0 && v.durationSec <= 15);

      allVideos = allVideos.concat(shorts);
    } catch (err) {
      console.error("🔥 Keyword fetch failed:", err.message);
    }
  }

  // Dummy fallback if no Shorts found
  if (allVideos.length === 0) {
    allVideos = [
      {
        videoId: "dummy1",
        title: "Test Short 1",
        channel: "AI Baby Trends",
        durationSec: 10,
        views: 1200,
        publishedAt: new Date().toISOString()
      },
      {
        videoId: "dummy2",
        title: "Test Short 2",
        channel: "Cute Baby",
        durationSec: 12,
        views: 800,
        publishedAt: new Date().toISOString()
      }
    ];
  }

  return allVideos;
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
    const shorts = await fetchShortsByKeyword();

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
