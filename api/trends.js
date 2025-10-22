import fetch from "node-fetch";

export default async function handler(req, res) {
  const keyword = req.query.keyword || "navidad";
  const country = req.query.country || "CO";

  try {
    const reqBody = {
      comparisonItem: [{ keyword, geo: country, time: "today 12-m" }],
      category: 0,
      property: "",
    };

    const url = `https://trends.google.com/trends/api/explore?hl=es-419&tz=-300&req=${encodeURIComponent(
      JSON.stringify(reqBody)
    )}`;

    const response = await fetch(url);
    let raw = await response.text();

    // 🔥 Limpieza mejorada
    const jsonStart = raw.indexOf("{");
    const cleanJson = raw.slice(jsonStart).trim();

    const data = JSON.parse(cleanJson);

    return res.status(200).json({
      ok: true,
      keyword,
      country,
      results: data,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al obtener datos",
      detalle: error.message,
    });
  }
}
