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

    // 🔥 Limpieza extrema para evitar errores de JSON
    raw = raw
      .replace(/^[\)\]\}'\s]+/, "") // quita )]}'
      .replace(/[^\x20-\x7E]+/g, "") // elimina caracteres invisibles
      .trim();

    // Encuentra el primer { y corta antes
    const start = raw.indexOf("{");
    if (start > 0) raw = raw.substring(start);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (jsonError) {
      console.error("Error al parsear JSON limpio:", raw.slice(0, 200));
      throw jsonError;
    }

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
