import fetch from "node-fetch";

export default async function handler(req, res) {
  const keyword = req.query.keyword || "navidad";
  const country = req.query.country || "CO";

  try {
    // 🔹 1. Consulta a Google Trends
    const trendsURL = `https://trends.google.com/trends/api/explore?hl=es-419&tz=-300&req=${encodeURIComponent(
      JSON.stringify({
        comparisonItem: [{ keyword, geo: country, time: "today 12-m" }],
        category: 0,
        property: "",
      })
    )}`;

    const trendsResponse = await fetch(trendsURL);
    let trendsText = await trendsResponse.text();

    // 🔹 Limpieza: elimina prefijos basura (como )]}', o espacios)
    trendsText = trendsText.replace(/^[^\{]+/, "").trim();

    let trendsData;
    try {
      trendsData = JSON.parse(trendsText);
    } catch (err) {
      throw new Error("No se pudo interpretar la respuesta de Google Trends");
    }

    const relatedToken = trendsData.widgets?.find(
      (w) => w.id === "RELATED_TOPICS"
    )?.token;

    if (!relatedToken)
      throw new Error("No se encontró token de temas relacionados");

    // 🔹 2. Solicitud a temas relacionados
    const relatedURL = `https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=es-419&tz=-300&req=${encodeURIComponent(
      JSON.stringify({
        restriction: {
          geo: { country },
          time: "today 12-m",
          complexKeywordsRestriction: {
            keyword: [{ type: "BROAD", value: keyword }],
          },
        },
        keywordType: "QUERY",
        metric: ["TOP"],
        trendinessSettings: { compareTime: "today 12-m" },
        requestOptions: { property: "", backend: "IZG", category: 0 },
      })
    )}&token=${relatedToken}`;

    const relatedResponse = await fetch(relatedURL);
    let relatedText = await relatedResponse.text();
    relatedText = relatedText.replace(/^[^\{]+/, "").trim();

    const relatedData = JSON.parse(relatedText);
    const related =
      relatedData.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 5) || [];

    // 🔹 3. Agregar datos de Mercado Libre e imágenes
    const enriched = await Promise.all(
      related.map(async (item) => {
        const title = item.query || item.topic?.title || "Producto en tendencia";
        const mlUrl = `https://api.mercadolibre.com/sites/MCO/search?q=${encodeURIComponent(
          title
        )}`;
        const mlResp = await fetch(mlUrl);
        const mlJson = await mlResp.json();
        const firstItem = mlJson.results?.[0];

        const imageUrl = firstItem?.thumbnail
          ? firstItem.thumbnail
          : `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
              title + " producto"
            )}`;

        return {
          title,
          interest: item.value || 0,
          link: firstItem?.permalink || imageUrl,
          price: firstItem?.price || null,
          thumbnail: imageUrl,
          source: "Google Trends + Mercado Libre",
        };
      })
    );

    res.status(200).json({
      ok: true,
      keyword,
      country,
      total: enriched.length,
      results: enriched,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error al obtener datos",
      detalle: error.message,
    });
  }
}
