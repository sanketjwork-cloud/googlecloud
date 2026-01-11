import express from "express";
import fetch from "node-fetch"; // if you need YouTube API calls
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Discovery keyword
const discoveryKeyword = "satirical baby reactions";

// Core keywords (for your script content)
const coreKeywords = [
  "judging parents humor",
  "1 year old wit",
  "baby sarcasm shorts",
  "funny baby commentary",
  "baby adult voice"
];

app.get("/shorts", async (req, res) => {
  try {
    // YouTube API or internal logic goes here
    // Example: just returning keywords for now
    res.json({
      discoveryKeyword,
      coreKeywords,
      message: "Server is up, keywords ready!"
    });
  } catch (err) {
    console.error("Error fetching shorts data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on PORT ${PORT}`);
});
