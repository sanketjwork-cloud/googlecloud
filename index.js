import http from "http";

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
  // Allow browser & Make.com
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  // Root health check (VERY IMPORTANT)
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: "ok",
        message: "YouTube AI Agent is running 🚀",
        generatedAt: new Date().toISOString()
      })
    );
    return;
  }

  // Shorts endpoint (placeholder logic for now)
  if (req.url.startsWith("/shorts") && req.method === "GET") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        shorts: []
      })
    );
    return;
  }

  // Fallback
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
