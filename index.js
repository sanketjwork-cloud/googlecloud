import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// === Keywords setup ===
const discoveryKeyword = "satirical baby reactions";
const coreKeywords = [
  "judging parents humor",
  "1 year old wit",
  "baby sarcasm shorts"
];

// Function to fetch videos for a keyword
async function fetchVideosForKeyword(keyword) {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn("YouTube API key not set, using placeholder data");
      return [
        {
          videoId: "placeholder123",
          title: `Placeholder for ${keyword}`,
          channel: "Demo Channel",
          views: 0,
          durationSec: 15,
          publishedAt: new Date().toISOString(),
          trendScore: 0
        }
      ];
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: keyword,
        type: 'video',
        videoDuration: 'short',
        maxResults: 10,
        key: YOUTUBE_API_KEY
      }
    });
    
    return response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.default.url
    }));
  } catch (error) {
    console.error(`Error fetching videos for keyword "${keyword}":`, error.message);
    return [];
  }
}

// Root route
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "YouTube AI Agent is running 🚀",
    generatedAt: new Date().toISOString()
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).send("healthy");
});

// Shorts route
app.get("/shorts", async (req, res) => {
  try {
    let allShorts = [];
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
      totalShorts: uniqueShorts.length,
      message: "Server is up, shorts data ready!",
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Error fetching shorts data", 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
