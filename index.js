import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

console.log("🚀 Booting YouTube AI Agent...");
console.log("PORT:", PORT);
console.log("API KEY present:", Boolean(API_KEY));

async function fetchShorts() {
  if (!API_KEY) {
    console.error("❌ YOUTUBE_API_KEY missing");
    return [];
  }

  try {
    // Example query – can be refined later
    const query = "shorts";
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) return [];

    return data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));
  } catch (err) {
    console.error("🔥 YouTube fetch failed:", err.message);
    return [];
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
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
    const shorts = await fetchShorts();

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
