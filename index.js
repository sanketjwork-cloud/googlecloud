import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing YOUTUBE_API_KEY");
  process.exit(1);
}

console.log("🚀 YouTube AI Shorts Agent starting...");
console.log("PORT:", PORT);

const DISCOVERY_KEYWORD = "satirical baby reactions";
const CORE_KEYWORDS = [
  "judging parents humor",
  "1 year old wit",
  "baby sarcasm shorts",
  "funny baby commentary",
  "baby adult voice"
];

// Helper: fetch shorts from YouTube
async function fetchShorts(keyword) {
  const query = encodeURIComponent(keyword);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${query}&key=${API_KEY}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.items) return { count: 0, shorts: [] };

    const shorts = data.items.map((item) => {
      const { videoId } = item.id;
      const { title, channelTitle, publishedAt, description } = item.snippet;
      const durationSec = 10 + Math.floor(Math.random() * 20); // placeholder
      const views = 100000 + Math.floor(Math.random() * 1000000); // placeholder
      const trendScore = Math.floor(views / (durationSec || 1)); // simple trend score
      return {
        videoId,
        title,
        channel: channelTitle,
        durationSec,
        views,
        publishedAt,
        trendSco
