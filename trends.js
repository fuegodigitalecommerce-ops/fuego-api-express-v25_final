// api/trends.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/api/trends", async (req, res) => {
  const { keyword = "Navidad", geo = "CO" } = req.query;

  try {
    const response = await fetch(
      `https://trends.google.com/trends/api/explore?hl=es-419&tz=-180&req={"comparisonItem":[{"keyword":"${keyword}","geo":"${geo}","time":"now 7-d"}],"category":0,"property":""}&tz=-180`
    );

    const dataText = await response.text();
    const jsonStart = dataText.indexOf("{");
    const jsonData = JSON.parse(dataText.slice(jsonStart));

    res.json({
      keyword,
      geo,
      trends: jsonData.widgets || [],
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tendencias", details: error.message });
  }
});

export default app;
