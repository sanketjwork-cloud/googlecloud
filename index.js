import http from "http";
import { URL } from "url";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing YOUTUBE_API_KEY");
}

// ---------------- CONFIG ----------------
const AI_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "ai baby",
  "ai generated",
  "chatgpt",
  "midjourney",
  "sora",
  "stable diffusion",
  "elevenlabs",
  "ai voice",
  "ai avatar"
];

const AI_CHANNEL_IDS = [
  "UCYOFR8S4AU2UbEyhoPvEFiA", // AI Baby Trends
  "UCUEGP4m4tQi-aWJ2G1npNcg", // Cute Baby
  "UCqoP7gx5GR9SxbiDfXNn1qA", // Baby Dance
  "UCPEFJosRQkA8SmWBIGUlP_A"  // Healing Dreams
];

// ----------------------------------------

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.json();
}

function isAIContent(text = "") {
  const lower = text.toLowerCase();
  return AI_KEYWORDS.some(k => lower.includes(k));
}

function toCSV(data) {
  if (!data.length) return "videoId,title,channel,views,publishedAt\n";

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj =>
    Object.values(obj)
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers, ...rows].join("\n");
}

async function discoverShorts() {
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&videoDuration=short&maxResults=25&` +
    `publishedAfter=${publishedAfter}&q=AI&key=${API_KEY}`;

  const search = await fetchJSON(searchUrl);

  const videoIds = search.items.map(i => i.id.videoId).join(",");
  if (!videoIds) return [];

  const statsUrl =
    `https://www.googleapis.com/youtube/v3/videos?` +
    `part=statistics,snippet&id=${videoIds}&key=${API_KEY}`;

  const stats = await fetchJSON(statsUrl);

  return stats.items
    .map(v => {
      const views = Number(v.statistics.viewCount || 0);
      const published = new Date(v.snippet.publishedAt);
      const hoursOld = (Date.now() - published.getTime()) / 36e5;

      return {
        videoId: v.id,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        publishedAt: v.snippet.publishedAt,
        views,
        viewsPerHour: Math.round(views / Math.max(hoursOld, 1)),
        isAI:
          isAIContent(v.snippet.title) ||
          isAIContent(v.snippet.description) ||
          AI_CHANNEL_IDS.includes(v.snippet.channelId)
      };
    })
    .filter(v => v.isAI && v.viewsPerHour > 50)
    .sort((a, b) => b.viewsPerHour - a.viewsPerHour)
    .slice(0, 20);
}

// ---------------- SERVER ----------------
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    // Root
    if (url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        status: "ok",
        message: "YouTube AI Agent is running 🚀",
        generatedAt: new Date().toISOString()
      }));
    }

    // JSON Shorts
    if (url.pathname === "/shorts") {
      const shorts = await discoverShorts();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        generatedAt: new Date()
