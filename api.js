// Backend öncelikli AI çağrısı. Sıra:
// 1) Apps Script proxy (anahtar sunucuda, telefona yazılmaz) →
// 2) Gömülü/yazılı Gemini anahtarı (kişisel mod) → 3) boş (kural motoru).
// KAPI değeri gizli anahtar DEĞİLDİR (kaynakta görünür); amatör kullanımı
// engeller. Gerçek koruma: Script tarafındaki günlük kota + anahtar gizliliği.
function cfg(k) {
  if (k === "url") return ((window.BACKEND_URL || "").trim() || localStorage.getItem("backend-url") || "");
  return ((window.KAPI || "").trim() || localStorage.getItem("backend-kapi") || "");
}
async function backendIste(soru, baglam, resim) {
  try {
    const url = cfg("url");
    if (!url || url.includes("SENIN-IDN")) return "";
    const r = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ sifre: cfg("kapi"), soru, baglam, resim: resim || null })
    });
    const j = await r.json();
    return j.cevap || "";
  } catch (e) { return ""; }
}
