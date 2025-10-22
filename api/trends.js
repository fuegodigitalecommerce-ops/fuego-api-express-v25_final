import fetch from "node-fetch";

export default async function handler(req, res) {
  const keyword = req.query.keyword || "navidad";
  const country = req.query.country || "CO";

  try {
    const trendsURL = `https://trends.google.com/trends/api/explore?hl=es-419&tz=-300&req=${encodeURIComponent(
      JSON.stringify({
        comparisonItem: [{ keyword, geo: country, time: "today 12-m" }],
        category: 0,
        property: "",
      })
    )}`;

    const response = await fetch(trendsURL);
    const text = await response.text();

    // ✅ Enviamos la respuesta cruda para inspección
    res.status(200).json({
      ok: true,
      debug: "Respuesta cruda desde Google Trends",
      keyword,
      country,
      trendsURL,
      preview: text.slice(0, 500), // solo los primeros 500 caracteres
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error al obtener datos",
      detalle: error.message,
    });
  }
}
