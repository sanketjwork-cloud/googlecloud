// index.js
const express = require("express");
const app = express();

// Pull port from environment variable or default to 8080
const PORT = process.env.PORT || 8080;

// Core data for /shorts
const shortsData = {
  discoveryKeyword: "satirical baby reactions",
  coreKeywords: [
    "judging parents humor",
    "1 year old wit",
    "baby sarcasm shorts",
    "funny baby commentary",
    "baby adult voice"
  ],
  message: "Server is up, keywords ready!"
};

// Route: root / → redirect to /shorts
app.get("/", (req, res) => {
  res.redirect("/shorts");
});

// Route: /shorts → returns JSON
app.get("/shorts", (req, res) => {
  res.json(shortsData);
});

// Health check (optional, good for Cloud Run)
app.get("/health", (req, res) => {
  res.send("ok");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
