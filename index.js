import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "YouTube AI Agent is running 🚀",
    generatedAt: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).send("healthy");
});

app.get("/discover", async (req, res) => {
  res.json({
    generatedAt: new Date().toISOString(),
    niche: "AI Baby / Cute / Healing",
    shorts: [
      {
        title: "AI Baby Laughing 😂",
        hook: "Wait till the end 😳",
        duration: "7s",
        style: "cute + loop"
      },
      {
        title: "Baby Dance in AI World 💃",
        hook: "This is too smooth",
        duration: "6s",
        style: "dance + beat sync"
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
