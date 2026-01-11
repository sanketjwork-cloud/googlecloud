const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// === Keywords setup ===
const discoveryKeyword = "satirical baby reactions";
const coreKeywords = [
  "judging parents humor",
  "1 year old wit",
  "baby sarcasm shorts" // your 3rd keyword
];

// Function to fetch videos for a keyword (simulate API call / placeholder)
async function fetchVideosForKeyword(keyword) {
  // Replace with your YouTube API call or existing logic
  // For now, placeholder returning a few sample videos
  return [
    {
      videoId: "y8kneKeNyCI",
      title: "Belly Button Song Dance! Learn about the Body! CoComelon #Shorts",
      channel: "Cocomelon - Nursery Rhymes",
      views: 1224700881,
      durationSec: 15,
      publishedAt: "2023-04-03T07:00:19Z",
      trendScore: 81647
    },
    {
      videoId: "abc123XyZ",
      title: `Funny ${keyword} Short Example`,
      channel: "Baby Humor Channel",
      views: 125000,
      durationSec: 12,
      publishedAt: "2025-12-30T10:00:00Z",
      trendScore: 2300
    }
  ];
}

// /shorts route
app.get("/shorts", async (req, res) => {
  try {
    let allShorts = [];

    // Loop through keywords
    const allKeywords = [discoveryKeyword, ...coreKeywords];
    for (const keyword of allKeywords) {
      const videos = await fetchVideosForKeyword(keyword);
      allShorts = allShorts.concat(videos);
    }

    // Remove duplicates by videoId
    const uniqueShorts = allShorts.filter(
      (v, i, a) => a.findIndex((t) => t.videoId === v.videoId) === i
    );

    res.json({
      discoveryKeyword,
      coreKeywords,
      shorts: uniqueShorts,
      message: "Server is up, shorts data ready!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching shorts data", error: error.message });
  }
});

// Keep only /shorts, no root route
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
