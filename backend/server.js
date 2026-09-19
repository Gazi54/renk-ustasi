// Renk Ustası backend iskeleti — bağımlılık yok (saf Node).
// Görevi (mimari madde 8): API anahtarını sunucuda tut, kullanıcıyı doğrula,
// renk verisini topla, AI'ya gönder, sonucu döndür. HTML'e anahtar konmaz.
// Çalıştırma: GEMINI_KEY=... node server.js  →  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, "db.json");
const oku = () => { try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return { calismalar: [] }; } };
const yaz = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const govde = req => new Promise(res => { let b = ""; req.on("data", c => b += c); req.on("end", () => res(b)); });
const json = (res, kod, o) => { res.writeHead(kod, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };

async function gemini(soru, baglam) {
  const key = process.env.GEMINI_KEY;
  if (!key) throw new Error("GEMINI_KEY yok");
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Oto boya asistanısın. Kısa cevap. Kesin gramaj uydurma, metamerizm garantisi verme. Bağlam: " + (baglam || "") + "\nSoru: " + soru }] }] })
  });
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || "AI cevap üretemedi.";
}

http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/api/saglik") return json(res, 200, { ok: true });
  if (req.method === "POST" && req.url === "/api/ai") {
    try { const { soru, baglam } = JSON.parse(await govde(req)); return json(res, 200, { cevap: await gemini(soru, baglam) }); }
    catch (e) { return json(res, 500, { hata: String(e.message || e) }); }
  }
  if (req.method === "GET" && req.url === "/api/calismalar") return json(res, 200, oku());
  if (req.method === "POST" && req.url === "/api/calismalar") {
    try {
      const d = oku(); const k = JSON.parse(await govde(req));
      k.id = Date.now(); k.tarih = new Date().toISOString(); d.calismalar.push(k); yaz(d);
      return json(res, 200, { ok: true, id: k.id });
    } catch (e) { return json(res, 500, { hata: String(e.message || e) }); }
  }
  return json(res, 404, { hata: "yok" });
}).listen(PORT, () => console.log("Renk Ustasi backend :" + PORT));
