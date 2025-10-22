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
    let text = await response.text();

    // 🔹 Elimina el prefijo no válido de Google Trends: )]}',
    if (text.startsWith(")]}',")) {
      text = text.substring(5);
    }

    // 🔹 Ahora sí, intenta parsear el JSON limpio
    const data = JSON.parse(text);

    // ✅ Si hay widgets relacionados, los mostramos
    const relatedWidget = data.widgets?.find((w) => w.id === "RELATED_TOPICS");
    const token = relatedWidget?.token || null;

    res.status(200).json({
      ok: true,
      keyword,
      country,
      token,
      message: "Google Trends limpio y funcionando correctamente",
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error al procesar la respuesta de Google Trends",
      detalle: error.message,
    });
  }
}
