app.get("/shorts", async (req, res) => {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;

    const query = req.query.q || "AI baby cute";
    const maxResults = 25;

    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&type=video` +
      `&videoDuration=short` +
      `&order=viewCount` +
      `&q=${encodeURIComponent(query)}` +
      `&maxResults=${maxResults}` +
      `&key=${API_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const shorts = (searchData.items || []).map(v => ({
      videoId: v.id.videoId,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
      videoUrl: `https://youtube.com/shorts/${v.id.videoId}`
    }));

    res.json({
      generatedAt: new Date().toISOString(),
      keyword: query,
      count: shorts.length,
      shorts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
