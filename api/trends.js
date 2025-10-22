import fetch from "node-fetch";

export default async function handler(req, res) {
  const keyword = req.query.keyword || "navidad";
  const country = req.query.country || "CO";

  try {
    // 🔥 1. Solicitud a Google Trends
    const trendsURL = `https://trends.google.com/trends/api/explore?hl=es-419&tz=-300&req={"comparisonItem":[{"keyword":"${keyword}","geo":"${country}","time":"today 12-m"}],"category":0,"property":""}`;
    const trendsResponse = await fetch(trendsURL);
    let trendsText = await trendsResponse.text();

    // Limpieza del formato raro de Google (quita paréntesis o basura inicial)
    trendsText = trendsText.replace(/^[^{]+/, "");
    const trendsData = JSON.parse(trendsText);

    // Busca el token de temas relacionados
    const relatedToken = trendsData.widgets?.find((w) => w.id === "RELATED_TOPICS")?.token;
    if (!relatedToken) throw new Error("No se encontró token de tendencias relacionadas");

    // 🔥 2. Solicitud de temas relacionados reales
    const relatedURL = `https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=es-419&tz=-300&req={"restriction":{"geo":{"country":"${country}"},"time":"today 12-m","complexKeywordsRestriction":{"keyword":[{"type":"BROAD","value":"${keyword}"}]}},"keywordType":"QUERY","metric":["TOP"],"trendinessSettings":{"compareTime":"today 12-m"},"requestOptions":{"property":"","backend":"IZG","category":0}}&token=${relatedToken}`;
    const relatedResponse = await fetch(relatedURL);
    let relatedText = await relatedResponse.text();
    relatedText = relatedText.replace(/^[^{]+/, "");
    const relatedData = JSON.parse(relatedText);

    const related = relatedData.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 5) || [];

    // 🔥 3. Enriquecer con datos de Mercado Libre e imágenes
    const enriched = await Promise.all(
      related.map(async (item) => {
        const title = item.query || item.topic?.title || "Producto en tendencia";

        // Mercado Libre
        const mlUrl = `https://api.mercadolibre.com/sites/MCO/search?q=${encodeURIComponent(title)}`;
        const mlResp = await fetch(mlUrl);
        const mlJson = await mlResp.json();
        const firstItem = mlJson.results?.[0];

        // Imagen desde Google
        const imageQuery = encodeURIComponent(title + " producto");
        const imageUrl = `https://www.google.com/search?tbm=isch&q=${imageQuery}`;

        return {
          title,
          interest: item.value || 0,
          link: firstItem?.permalink || imageUrl,
          price: firstItem?.price || null,
          thumbnail: firstItem?.thumbnail || null,
          source: "Google Trends + Mercado Libre"
        };
      })
    );

    // Respuesta final limpia
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
