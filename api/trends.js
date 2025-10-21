export default async function handler(req, res) {
  const { keyword = "Navidad", geo = "CO" } = req.query;

  const simulated = [
    { id: 1, title: `🔥 Producto top en "${keyword}"`, country: geo, score: 95 },
    { id: 2, title: `Tendencia destacada de ${geo}`, country: geo, score: 88 },
    { id: 3, title: "Lo más buscado esta semana", country: geo, score: 81 }
  ];

  res.status(200).json({
    ok: true,
    keyword,
    geo,
    results: simulated
  });
}
