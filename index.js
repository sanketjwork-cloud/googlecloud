import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

console.log("🚀 Booting YouTube AI Agent...");
console.log("PORT:", PORT);
console.log("API KEY present:", Boolean(API_KEY));

// Keyword search
const SEARCH_KEYWORD = "baby";

// Minimum views to consider trending
const MIN_VIEWS = 100000;

// Convert ISO 8601 duration to seconds
function parseDurationToSeconds(duration) {
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const minutes = parseInt(match[1] || "0", 10);
  const seconds = parseInt(match[2] || "0", 10);
  return minutes * 60 + seconds;
}

// Fetch trending baby videos
async function fetchTrendingBabyVideos() {
  if (!API_KEY) {
    console.error("❌ YOUTUBE_API_KEY missing");
    return [];
  }

  try {
    // Search videos by keyword (maxResults=50)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      SEARCH_KEYWORD
    )}&maxResults=50&order=viewCount&key=${API_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchData.items) return [];

    const videoIds = searchData.items.map(v => v.id.videoId).join(",");
    if (!videoIds) return [];

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();
    if (!detailsData.items) return [];

    // Filter videos with views >= MIN_VIEWS
    const trendingVideos = detailsData.items
      .map(video => {
        const durationSec = parseDurationToSeconds(video.contentDetails.duration);
        return {
          videoId: video.id,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          durationSec,
          views: Number(video.statistics.viewCount || 0),
          publishedAt: video.snippet.publishedAt,
          description: video.snippet.description
        };
      })
      .filter(v => v.views >= MIN_VIEWS); // only trending by views

    return trendingVideos;
  } catch (err) {
    console.error("🔥 Fetch failed:", err.message);
    return [];
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
    const shorts = await fetchTrendingBabyVideos();

    // Fallback dummy videos if none found
    const result = shorts.length
      ? shorts
      : [
          {
            videoId: "dummy1",
            title: "Trending Baby Short 1",
            channel: "AI Baby Trends",
            durationSec: 12,
            views: 150000,
            publishedAt: new Date().toISOString(),
            description: "Dummy fallback video"
          },
          {
            videoId: "dummy2",
            title: "Trending Baby Short 2",
            channel: "Cute Baby",
            durationSec: 10,
            views: 200000,
            publishedAt: new Date().toISOString(),
            description: "Dummy fallback video"
          }
        ];

    return res.end(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        count: result.length,
        shorts: result
      })
    );
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
