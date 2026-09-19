// RENK ASİSTANI v2 — TAHMİNİ analiz + formül üretici (ölçüm değildir)
let ALL = {}, CALISMA = {}; // CALISMA: {tonerId: gram}
const $ = id => document.getElementById(id);
// Sade soru dili: tek dokunuşluk seçenekler (varsayılan = sorun yok)
const S = { onL: "uygun", altL: "uygun", onY: "degismesin", altY: "degismesin", onK: "hayir", altK: "hayir", met: "ayni" };
const YON_ETIKET = { degismesin: "Değişmesin", kirmizi: "Kırmızıya", turuncu: "Turuncuya", sari: "Sarıya", yesil: "Yeşile", mavi: "Maviye", mor: "Mora" };
const YON_KOK = { kirmizi: "kırmızı", turuncu: "turuncu", sari: "sarı", yesil: "yeşil", mavi: "mavi", mor: "mor" };
function seg(elId, secenekler, varsayilan, anahtar) {
  const el = $(elId); el.innerHTML = "";
  S[anahtar] = varsayilan;
  secenekler.forEach(([deger, etiket]) => {
    const d = document.createElement("button");
    d.type = "button"; d.className = "seg-btn" + (deger === varsayilan ? " on" : ""); d.textContent = etiket;
    d.onclick = () => { S[anahtar] = deger; [...el.children].forEach(c => c.classList.remove("on")); d.classList.add("on"); };
    el.appendChild(d);
  });
}
seg("seg-onL", [["acik", "Fazla açık"], ["uygun", "Uygun"], ["koyu", "Fazla koyu"]], "uygun", "onL");
seg("seg-altL", [["acik", "Fazla açık"], ["uygun", "Uygun"], ["koyu", "Fazla koyu"]], "uygun", "altL");
seg("seg-onY", Object.entries(YON_ETIKET), "degismesin", "onY");
seg("seg-altY", Object.entries(YON_ETIKET), "degismesin", "altY");
seg("seg-onK", [["hayir", "Hayır"], ["evet", "Evet, temizle"]], "hayir", "onK");
seg("seg-altK", [["hayir", "Hayır"], ["evet", "Evet, temizle"]], "hayir", "altK");
seg("seg-met", [["ince", "Daha ince"], ["ayni", "Aynı"], ["iri", "Daha iri"]], "ayni", "met");
const hedefYonler = () => new Set([S.onY, S.altY].filter(v => v !== "degismesin").map(v => YON_KOK[v]));
const taneTercihi = () => S.met === "iri" ? "İRİ" : S.met === "ince" ? "KÜÇÜK" : "";
// ---------- DB ----------
async function yukleDB() {
  const kur = arr => { arr.forEach(t => ALL[t.toner_id] = t); tonerChipleriKur(); };
  try {
    const [s, e] = await Promise.all([
      fetch("../data/toners/dynacoat-MM-solid.json").then(r => { if (!r.ok) throw 0; return r.json(); }),
      fetch("../data/toners/dynacoat-MM-effect-binder.json").then(r => { if (!r.ok) throw 0; return r.json(); })
    ]);
    kur([...s.toners, ...e.toners]);
    try {
      const a = await fetch("../data/toners/renumber-aliases.json").then(r => r.json());
      a.esdegerlikler.forEach(x => {
        if (ALL[x.equals]) ALL[x.new_id] = { ...ALL[x.equals], toner_id: x.new_id, alias_of: x.equals, alias_notu: x.not, alias_guven: "ORTA (saha beyani)" };
      });
    } catch (e2) { /* alias yoksa devam */ }
  } catch (err) {
    // dosya:// veya hatalı yol — gömülü veri devreye girer
    if (window.TONER_DATA && window.TONER_DATA.length) kur(window.TONER_DATA);
    else { document.getElementById("formul-sonuc").textContent = "Veri yüklenemedi — http ile açın (dosya:// olmaz)."; return; }
  }
  document.getElementById("formul-sonuc").textContent = Object.keys(ALL).length + " toner yüklü. Formülü girip analize bas.";
}

// ---------- Kolay formül girişi: toner çipleri ----------
const GRUPLAR = [
  ["Beyaz", ["4200", "4100", "4101", "4106"]], ["Kırmızı", ["4233", "4232", "4230", "4206", "4203", "4236"]],
  ["Turuncu", ["4246", "4243", "4248"]], ["Sarı", ["4456", "4457", "4435", "4434", "4400", "4452"]],
  ["Yeşil", ["4545", "4565"]], ["Mavi", ["4624", "4654", "4655", "4656", "4680", "4681"]],
  ["Mor", ["4700", "4723", "4276"]], ["Siyah", ["4800", "4840", "4198"]],
  ["Metalik", ["4001", "4002", "4003", "4004", "4005", "4006", "4007"]],
  ["Sedef", ["4910", "4911", "4925", "4957", "4966", "4903"]], ["Binder", ["4110", "4120", "4010", "4000"]]
];
function tonerChipleriKur() {
  const el = $("toner-chip"); el.innerHTML = "";
  GRUPLAR.forEach(([ad, ids]) => {
    const h = document.createElement("div"); h.className = "chip grup"; h.textContent = ad; el.appendChild(h);
    ids.forEach(id => {
      const t = ALL[id]; if (!t) return;
      const d = document.createElement("div");
      d.className = "chip"; d.id = "chip-" + id;
      d.title = t.technical_notes;
      d.innerHTML = `<b>${id}</b><br><small>${t.face_color}${t.face_direction ? "/" + t.face_direction : ""}</small>`;
      d.onclick = () => { CALISMA[id] = (CALISMA[id] || 0) + (id.startsWith("4") && ["4001","4002","4003","4004","4005","4006","4007"].includes(id) ? 10 : 2); senkron(); };
      el.appendChild(d);
    });
  });
}
function senkron() {
  $("f-text").value = Object.entries(CALISMA).map(([k, v]) => `${k} = ${v.toFixed(1)}`).join("\n");
  Object.keys(ALL).forEach(id => { const c = $("chip-" + id); if (c) c.classList.toggle("on", !!CALISMA[id]); });
}
$("f-text").addEventListener("change", () => {
  const { kalemler } = formuluOku($("f-text").value);
  CALISMA = {}; kalemler.forEach(k => CALISMA[k.id] = k.gram); senkron();
});
function formuluOku(text) {
  // Tablo/fotoğraf formatına dayanıklı: metnin HERHANGİ bir yerindeki
  // "4xxx ... 12,5 g" eşleşmelerini bulur (satır düzeni şart değil).
  const kalemler = [], hatalar = [];
  const re = /\b(4\d{3})\b[^\d]{0,40}(\d+[.,]\d+|\d+)\s*g?/g;
  let m; const gorulen = new Set();
  while ((m = re.exec(text)) !== null) {
    const id = m[1], gram = parseFloat(m[2].replace(",", "."));
    if (gorulen.has(id)) continue; gorulen.add(id);
    if (isNaN(gram)) { hatalar.push(id + " için gram okunamadı"); continue; }
    kalemler.push({ id, gram });
  }
  if (!kalemler.length) {
    // eski satır-satır formata geri dön
    text.split("\n").map(s => s.trim()).filter(Boolean).forEach((s, i) => {
      const m2 = s.match(/(\d{3,4})\D{0,3}([\d.,]+)/);
      if (!m2) { hatalar.push((i + 1) + ". satır: " + s); return; }
      kalemler.push({ id: m2[1], gram: parseFloat(m2[2].replace(",", ".")) });
    });
  }
  return { kalemler, hatalar };
}

// ---------- Hazır renkler ----------
const HAZIR = [["Beyaz", "#f2f2f2", "beyaz"], ["Siyah", "#111111", "siyah"], ["Kırmızı", "#cc2222", "kırmızı"], ["Turuncu", "#e06600", "turuncu"], ["Sarı", "#e6c200", "sarı"], ["Yeşil", "#1a8a3c", "yeşil"], ["Mavi", "#1c4fd6", "mavi"], ["Mor", "#6a1cc0", "mor"]];
let hedefAile = "kırmızı";
(function () {
  const el = $("hazir-renk");
  HAZIR.forEach(([ad, hex, aile]) => {
    const d = document.createElement("div");
    d.className = "chip"; d.innerHTML = `<span style="display:inline-block;width:14px;height:14px;background:${hex};border-radius:4px"></span> ${ad}`;
    d.onclick = () => { $("h-renk").value = hex; hedefAile = aile; [...el.children].forEach(c => c.classList.remove("on")); d.classList.add("on"); };
    el.appendChild(d);
  });
})();
$("h-renk").addEventListener("input", e => { hedefAile = hexeEnYakin(e.target.value); });
function hexeEnYakin(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16));
  if (Math.max(r, g, b) - Math.min(r, g, b) < 30) return r > 150 ? "beyaz" : r < 80 ? "siyah" : "beyaz";
  const mx = Math.max(r, g, b);
  if (mx === r) return g > 110 ? (g > 150 && r > 180 ? "sarı" : "turuncu") : "kırmızı";
  if (mx === g) return "yeşil"; return b > r + 20 ? "mavi" : "mor";
}

// ---------- TAHMİNİ formül üretici (kural tabanlı, PDF davranışlarına dayalı) ----------
// ---------- TAHMİNİ formül üretici v2: PDF kriterleriyle puanlama ----------
// Her aday, dokümandaki face/flip/yön/temizlik/şeffaflık/kullanım alanına göre puanlanır.
// Oranlar TAHMİNİdir (Güven: DÜŞÜK); yön eşleşmesi dokümana dayanır (Güven: ORTA-YÜKSEK).
function adayPuanla(t, aile, canli, efektli) {
  if (!t || t.alias_of) t = ALL[t.alias_of || t.toner_id] || t;
  if (!t || ["metalik", "sedef", "binder"].includes(t.pigment_family)) return -99;
  if (efektli && t.effect_usage === false) return -99; // örn. 4200 efekte girmez
  if (!efektli && t.solid_usage === false) return -99;
  if (["4200", "4800", "4840", "4198"].includes(t.toner_id)) return -99; // zemin ayrı hesaplanır
  let p = 0;
  const pig = t.pigment_color || "", fc = t.face_color || "", fd = t.face_direction || "", fl = t.flip_color || "";
  if (pig.includes(aile)) p += 3; else if (fc.includes(aile)) p += 2;
  if (fd.includes(aile)) p += 1;
  if (fl.includes(aile)) p += 1;
  const fcClean = t.face_cleanliness || "";
  if (canli === "temiz" && fcClean.startsWith("temiz")) p += 2;
  if (canli === "kirli" && fcClean.includes("kirli")) p += 2;
  if (efektli && t.effect_usage) p += 1;
  if (!efektli && t.effect_usage && !t.solid_usage) p -= 2;
  if (t.not_recommended_usage) {
    if (aile === "beyaz") return -99;
    p -= 2;
  }
  return p;
}
$("b-uret").onclick = async () => {
  if (!Object.keys(ALL).length) { $("uretim").textContent = "DB henüz yüklenmedi, birkaç saniye bekle."; return; }
  const tip = $("h-tip").value, acik = $("h-acik").value, canli = $("h-temiz").value;
  const efektli = tip !== "solid";
  const toplam = Math.max(10, parseFloat($("h-gram").value) || 100);
  const tane = taneTercihi();
  const F = {}, neden = {}, guven = {};
  const koy = (id, yuzde, n, g) => { F[id] = (F[id] || 0) + toplam * yuzde / 100; (neden[id] = neden[id] || []).push(n); guven[id] = g; };
  const pdfOzet = t => `face:${t.face_color}/${t.face_direction || t.face_cleanliness || "?"} flip:${t.flip_color}/${t.flip_lightness || "?"}/${t.flip_behavior || "?"} ${t.transparency}${t.particle_size ? " " + t.particle_size : ""}`;
  // --- zemin (açıklık) — efekt renkte 4200 YASAK (solid örtücü), 4100 kullanılır ---
  const BEYAZ = efektli ? "4100" : "4200";
  if (hedefAile === "beyaz") koy(BEYAZ, 88, efektli ? "Beyaz zemin (şeffaf — efekte 4200 girmez)" : "Beyaz zemin — örtücü genel pigment (doküman)", "YÜKSEK");
  else if (hedefAile === "siyah") koy(canli === "kirli" ? "4840" : "4800", 65, "Siyah zemin", "YÜKSEK");
  else {
    koy(BEYAZ, acik === "acik" ? 62 : acik === "koyu" ? 22 : 45, efektli ? "Açıklık zemini (şeffaf beyaz)" : "Açıklık zemini (beyaz örtücü)", "YÜKSEK");
    if (acik === "koyu" || acik === "orta") koy("4800", acik === "koyu" ? 10 : 4, "Koyultma/derinlik (şeffaf siyah, metalikle sarı yansımaya dikkat)", "ORTA");
  }
  // --- ana + yardımcı pigment (puanlama) ---
  if (hedefAile !== "beyaz" && hedefAile !== "siyah") {
    const sirali = Object.values(ALL).map(t => ({ t, p: adayPuanla(t, hedefAile, canli, efektli) }))
      .filter(x => x.p > 0).sort((a, b) => b.p - a.p)
      .filter((x, i, arr) => arr.findIndex(y => (y.t.alias_of || y.t.toner_id) === (x.t.alias_of || x.t.toner_id)) === i);
    const bir = sirali[0], iki = sirali.find(x => x.t.toner_id !== bir?.t.toner_id);
    if (bir) koy(bir.t.toner_id, acik === "acik" ? 18 : 32, `Ana renk (puan ${bir.p}): ${pdfOzet(bir.t)} — ${bir.t.technical_notes}`, "ORTA");
    if (iki) koy(iki.t.toner_id, 5, `Yön/flip desteği (puan ${iki.p}): ${pdfOzet(iki.t)} — ${iki.t.technical_notes}`, "ORTA");
    if (canli === "temiz" && ["mavi", "kırmızı"].includes(hedefAile)) {
      const parlat = hedefAile === "mavi" ? "4624" : "4233";
      if (!F[parlat]) koy(parlat, 4, "Parlaklık/temizlik için dokümanın önerdiği toner", "YÜKSEK");
    }
  } else if (hedefAile === "siyah" && canli === "temiz") {
    koy("4198", 6, "Grafit yarı-şeffaf: dumanlı efekt + flipte mavi etki", "ORTA");
  }
  // --- efekt (tane tercihine göre, 6. kart) ---
  if (efektli) {
    const metalId = tane.includes("İRİ") ? "4004" : tane.includes("KÜÇÜK") ? "4001" : tane.includes("YOĞUN") ? "4003" : "4003";
    const mt = ALL[metalId];
    koy(metalId, tip === "3katli" ? 6 : 12, `Metalik iskelet (${mt.particle_size}, ${mt.face_cleanliness})`, "ORTA");
    if (tip.includes("sedef") || tip === "3katli") {
      const sedefAdays = Object.values(ALL).filter(t => t.pigment_family === "sedef" && (t.face_color || "").includes(hedefAile === "beyaz" ? "beyaz" : hedefAile));
      const st = sedefAdays.sort((a, b) => {
        const sk = x => (tane.includes("İRİ") && (x.particle_size || "").includes("iri")) ? 0 : (tane.includes("KÜÇÜK") && (x.particle_size || "").includes("ince")) ? 0 : 1;
        return sk(a) - sk(b);
      })[0] || ALL["4910"];
      koy(st.toner_id, 7, `Sedef derinliği: ${pdfOzet(st)} — ${st.technical_notes}`, "ORTA");
    }
    koy("4110", 5, "Tane yönlendirici (face'i kirletir, flip'i açar, taneyi iri gösterir — limit %25)", "YÜKSEK");
    if (tip === "3katli") koy("4010", 8, "Glaze şeffaflığı (flip'i hafif koyultabilir)", "YÜKSEK");
  }
  // --- binder ile 4000 doldur (limit %35) ---
  const kullanilan = Object.values(F).reduce((a, v) => a + v, 0);
  const bos = toplam - kullanilan;
  if (bos > 0) {
    if (bos / toplam > 0.35) {
      const olcek = (toplam * 0.70) / kullanilan;
      Object.keys(F).forEach(k => F[k] *= olcek);
      koy("4000", 30, "Taşıyıcı binder (oran %35 limitine göre ayarlandı)", "YÜKSEK");
    } else koy("4000", bos / toplam * 100, "Taşıyıcı binder (limit %35)", "YÜKSEK");
  }
  let out = `🎨 TAHMİNİ BAŞLANGIÇ FORMÜLÜ — hedef: ${hedefAile} / ${tip} / ${acik} / ${canli}${tane ? " / tane:" + tane : ""} (toplam ~${toplam} g)\n`;
  out += "⚠ Üretici reçetesi DEĞİLDİR. Toner seçimleri PDF kriterlerine dayanır, ORANLAR tahmindir. Küçük numuneyle dene.\n\n";
  Object.entries(F).forEach(([id, g]) => {
    const t = ALL[id];
    out += `${id} = ${g.toFixed(1)} g (%${(g / toplam * 100).toFixed(0)}) — ${t?.pigment_color}, ${pdfOzet(t)}\n  Neden: ${[...new Set(neden[id])].join("; ")}\n  Kaynak: Dynacoat MM 20.04.2015${t?.alias_of ? " + saha beyanı (" + t.alias_of + " eşdeğeri)" : ""}. Güven: ${guven[id]} (oran tahmini: DÜŞÜK).\n`;
    if (t?.not_recommended_usage) out += `  ⚠ Üretici uyarısı: ${t.not_recommended_usage}\n`;
  });
  const ai = await geminiYorum(`Hedef: ${hedefAile} ${tip} ${acik} ${canli}. Formül: ${JSON.stringify(F)}. Kriterler: ${Object.keys(F).map(id => `${id}=${ALL[id]?.technical_notes || ""}`).join(" | ")}. PDF dışına çıkmadan kısa yorum yap, yabancı toner önerme, gramaj uydurma.`);
  if (ai) out += "\n🤖 AI notu: " + ai;
  $("uretim").textContent = out;
  $("uretim").dataset.formul = Object.entries(F).map(([k, v]) => `${k} = ${v.toFixed(1)}`).join("\n");
};
$("b-formule-koy").onclick = () => {
  const f = $("uretim").dataset.formul;
  if (!f) { alert("Önce formül üret."); return; }
  $("f-text").value = f;
  $("f-text").dispatchEvent(new Event("change"));
  $("formul-sonuc").textContent = "Üretilen formül çalışma formülüne kondu. Şimdi 'Formülü analiz et'e bas.";
  window.scrollTo(0, 0);
};

// ---------- Fotoğraftan okuma ----------
$("b-ocr").onclick = async () => {
  const f = $("foto").files[0];
  if (!f) { alert("Önce fotoğraf seç."); return; }
  $("formul-sonuc").textContent = "Okunuyor...";
  // 1) Gemini vision varsa onu dene (daha doğru)
  const g = await geminiOCR(f);
  let metin = g;
  // 2) yoksa telefonda Tesseract (Türkçe+İngilizce, tablo modunda)
  if (!metin) {
    try {
      const r = await Tesseract.recognize(f, "tur+eng", { tessedit_pageseg_mode: "6" });
      metin = r.data.text;
    } catch (e) { metin = ""; }
  }
  if (!metin) { $("formul-sonuc").textContent = "Okunamadı. Elle yazmayı dene."; return; }
  const { kalemler } = formuluOku(metin);
  if (!kalemler.length) { $("formul-sonuc").textContent = "OCR metni:\n" + metin.slice(0, 500) + "\n\nFormül bulunamadı — elle düzelt."; return; }
  CALISMA = {}; kalemler.forEach(k => CALISMA[k.id] = k.gram); senkron();
  $("formul-sonuc").textContent = "Fotoğraftan şu şekilde okudum (onayla, yanlışsa düzelt):\n" + $("f-text").value;
};

// ---------- Gemini (ücretsiz, opsiyonel) ----------
function gemKey() { return (window.GEMINI_KEY || "").trim() || localStorage.getItem("gem-key") || ""; }
function backendAktifMi() { return !!((window.BACKEND_URL || "").trim() && !(window.BACKEND_URL || "").includes("SENIN-IDN")); }
$("b-key").onclick = () => {
  const v = $("gem-key").value.trim();
  if (v) localStorage.setItem("gem-key", v);
  $("key-durum").textContent = v ? "AI açık (anahtar bu telefonda saklı)." : "AI kapalı — kural motoru aktif.";
};
if (backendAktifMi()) { $("key-durum").textContent = "AI açık (Apps Script backend — anahtar sunucuda)."; }
else if (gemKey()) { $("key-durum").textContent = "AI açık (kişisel anahtar)."; }
async function geminiYorum(prompt) {
  const b = await backendIste(prompt, "");
  if (b) return b;
  const k = gemKey(); if (!k) return "";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${k}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Oto boya asistanısın. Kısa ve net cevap ver. Asla kesin gramaj uydurma, metamerizm garantisi verme. Soru: " + prompt }] }] })
    });
    const j = await r.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) { return ""; }
}
async function geminiOCR(file) {
  let b64 = "";
  try { b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(",")[1]); fr.readAsDataURL(file); }); } catch (e) { return ""; }
  const SORU = "Bu boya formülü fotoğrafındaki toner numaralarını ve gramajları her satıra 'NUMARA = GRAM' formatında yaz. Başka bir şey yazma.";
  const b = await backendIste(SORU, "", { mime: file.type || "image/jpeg", data: b64 });
  if (b) return b;
  const k = gemKey(); if (!k) return "";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${k}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: SORU }, { inline_data: { mime_type: file.type || "image/jpeg", data: b64 } }] }] })
    });
    const j = await r.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) { return ""; }
}

// ---------- Analiz + düzeltme (Formül B adayı ÜRETİR) ----------
$("b-analiz").onclick = () => {
  const { kalemler, hatalar } = formuluOku($("f-text").value);
  if (!kalemler.length) { $("formul-sonuc").textContent = "Formül boş. Yukarıdan tonerlere dokun ya da fotoğraf yükle."; return; }
  const toplam = kalemler.reduce((a, k) => a + k.gram, 0);
  let out = "Formülü şu şekilde okudum (onaylı):\n";
  kalemler.forEach(k => {
    const t = ALL[k.id];
    out += `- ${k.id} = ${k.gram} g (%${(k.gram / toplam * 100).toFixed(1)}) ${t ? "| " + t.pigment_color + ", face:" + t.face_color + ", flip:" + t.flip_color : "| ❓ DB'de yok"}\n`;
  });
  const baskin = [...kalemler].sort((a, b) => b.gram - a.gram).slice(0, 3).map(k => ALL[k.id]?.face_color + "/" + (ALL[k.id]?.face_direction || "")).join(", ");
  out += `\nTAHMİNİ profil (ölçüm değil): baskın yönler: ${baskin}`;
  if (hatalar.length) out += "\n⚠ " + hatalar.join("\n");
  $("formul-sonuc").textContent = out;
};
function havuz(t) { return ((t.face_color || "") + " " + (t.face_direction || "") + " " + (t.flip_color || "")).toLocaleLowerCase("tr"); }
$("b-oner").onclick = async () => {
  const { kalemler } = formuluOku($("f-text").value);
  if (!kalemler.length) { $("sonuc").textContent = "Önce formül koy (1. veya 2. adım)."; return; }
  if (!Object.keys(ALL).length) { $("sonuc").textContent = "Toner verisi yüklenemedi — sayfayı yenileyip tekrar dene."; return; }
  const tip = ($("h-tip") && $("h-tip").value) || "metalik";
  const efektli = tip !== "solid";
  const isik = $("e-isik").value, meta = isik.includes("başka ışıkta kötü");
  const formdekiler = kalemler.map(k => k.id);
  const toplam = kalemler.reduce((a, k) => a + k.gram, 0) || 100;
  // KURAL 1: efekt renge solid-özel toner girmez (4200 gibi), solid renge efekt-özel girmez.
  const uygun = t => {
    if (!t || t.pigment_family === "binder") return true;
    if (efektli) return t.effect_usage !== false;
    return t.solid_usage !== false;
  };
  const onKok = S.onY === "degismesin" ? null : YON_KOK[S.onY];
  const altKok = S.altY === "degismesin" ? null : YON_KOK[S.altY];
  const faceSkor = (t, k) => {
    if (!k) return 0; let p = 0;
    const pig = t.pigment_color || "", fc = t.face_color || "", fd = t.face_direction || "";
    if (pig.includes(k)) p += 3; else if (fc.includes(k)) p += 2;
    if (fd.includes(k)) p += 1;
    if (S.onK === "evet" && (t.face_cleanliness || "").startsWith("temiz")) p += 1;
    return p;
  };
  const flipSkor = (t, k) => {
    if (!k) return 0; let p = 0;
    if ((t.flip_color || "").includes(k)) p += 2;
    return p;
  };
  const ZEMIN = ["4200", "4800", "4840", "4198", "4000", "4110", "4120", "4010"];
  const adaylar = Object.values(ALL).filter(t => uygun(t) && !ZEMIN.includes(t.toner_id) && t.pigment_family !== "binder");
  const sirala = (fn, k) => adaylar.map(t => ({ t, p: fn(t, k) })).filter(x => x.p > 0).sort((a, b) => b.p - a.p)
    .filter((x, i, a) => a.findIndex(y => (y.t.alias_of || y.t.toner_id) === (x.t.alias_of || x.t.toner_id)) === i);
  const B = {}; kalemler.forEach(k => B[k.id] = k.gram);
  const islem = [];
  const R = r => [toplam * r[0], toplam * r[1], toplam * (r[0] + r[1]) / 2];
  const uygula = (id, o, ad) => { B[id] = Math.max(0, (B[id] || 0) + (ad === "Azalt" ? -o : o)); };
  let saha = "";
  try { const r = await fetch("../data/corrections/2026-09-19-gri-mor-metalik-v1.json").then(x => x.json()); saha = r.yapilan_duzeltme.join(" "); } catch (e) {}
  const kayit = (t, ad, oran, etki, dis) => {
    const [a, b, o] = R(oran); uygula(t.toner_id, o, ad);
    islem.push({ t, ad, a, b, etki, dis: !!dis, saha: saha.includes(t.toner_id) });
  };
  // KURAL 2: istenen yöne göre — formüldekini Artır, dışarıdakini Ekle
  [["on", onKok, faceSkor], ["alt", altKok, flipSkor]].forEach(([ad, k, fn]) => {
    if (!k) return;
    const list = sirala(fn, k);
    const ic = list.find(x => formdekiler.includes(x.t.toner_id));
    const dis = list.find(x => !formdekiler.includes(x.t.toner_id));
    if (ic) kayit(ic.t, "Artır", [0.004, 0.01], `ön açı ${ic.t.face_color}/${ic.t.face_direction || ic.t.face_cleanliness || "?"} yöne çeker; alt açı ${ic.t.flip_color} etki güçlenir.`);
    if (dis) kayit(dis.t, "Ekle", [0.002, 0.005], `ön açı ${dis.t.face_color}/${dis.t.face_direction || dis.t.face_cleanliness || "?"} yöne çeker; alt açı ${dis.t.flip_color} yön verir.`, true);
  });
  // KURAL 3: açıklık — efekti şeffaf beyaz (4100) açar, ASLA 4200 değil
  if (S.onL === "koyu" || S.altL === "koyu") {
    const w = efektli ? ALL["4100"] : ALL["4200"];
    kayit(w, formdekiler.includes(w.toner_id) ? "Artır" : "Ekle", formdekiler.includes(w.toner_id) ? [0.004, 0.01] : [0.002, 0.005], efektli ? "az miktar flipi açar (şeffaf beyaz). Efekt renkte örtücü beyaz kullanılmaz." : "beyaz örtücü açar.", !formdekiler.includes(w.toner_id));
  }
  if (S.onL === "acik" || S.altL === "acik") {
    const koyId = (onKok === "mavi" || altKok === "mavi") ? "4840" : "4800";
    const kb = ALL[koyId];
    kayit(kb, formdekiler.includes(koyId) ? "Artır" : "Ekle", formdekiler.includes(koyId) ? [0.004, 0.01] : [0.002, 0.005], koyId === "4840" ? "ön açıyı koyulaştırır; gri-mavi ton, efektte açık flip verir." : "ön açıyı koyulaştırır, derinlik verir (şeffaf siyah).", !formdekiler.includes(koyId));
    ["4100", "4200"].forEach(wid => { if (formdekiler.includes(wid) && uygun(ALL[wid])) kayit(ALL[wid], "Azalt", [0.003, 0.008], "açıcı etki zayıflar, renk koyulaşır."); });
  }
  // KURAL 4: kirli → temizle: kirli tonerleri kıs
  if (S.onK === "evet" || S.altK === "evet") {
    kalemler.map(k => ALL[k.id]).filter(t => t && uygun(t) && (t.face_cleanliness || "").includes("kirli") && !ZEMIN.includes(t.toner_id))
      .slice(0, 2).forEach(t => kayit(t, "Azalt", [0.003, 0.008], "kirlilik kaynağı zayıflar, renk temizlenir."));
  }
  // KURAL 5: tane — iri/ince değişimi metalik takasıyla olur
  const IRI = ["4004", "4006", "4007"], INCE = ["4001", "4002", "4003"];
  if (efektli && S.met === "ince") {
    const kaba = IRI.find(id => formdekiler.includes(id));
    if (kaba) kayit(ALL[kaba], "Azalt", [0.01, 0.03], "iri tane etkisi zayıflar.");
    const inc = INCE.find(id => !formdekiler.includes(id)) || "4001";
    kayit(ALL[inc], formdekiler.includes(inc) ? "Artır" : "Ekle", [0.005, 0.015], `ince tane (${ALL[inc].particle_size}) güçlenir.`, !formdekiler.includes(inc));
  }
  if (efektli && S.met === "iri") {
    const ince = ["4001", "4002"].find(id => formdekiler.includes(id));
    if (ince) kayit(ALL[ince], "Azalt", [0.01, 0.03], "ince tane etkisi zayıflar.");
    const kaba = IRI.find(id => !formdekiler.includes(id)) || "4004";
    kayit(ALL[kaba], formdekiler.includes(kaba) ? "Artır" : "Ekle", [0.01, 0.03], `iri tane (${ALL[kaba].particle_size}) güçlenir.`, !formdekiler.includes(kaba));
  }
  // --- çıktı: öneri kartları + A→B tablosu ---
  let out = "ÖNERİ (TAHMİNİ başlangıç adımları — küçük numunede dene):\n\n";
  islem.slice(0, 7).forEach(o => {
    out += `${o.t.toner_id} ${o.ad} ${o.t.face_color}${o.t.face_direction ? "/" + o.t.face_direction : ""} ${o.saha ? "saha doğrulandı" : "resmi tablo"}\n  ${o.etki}\n  ${o.t.technical_notes}\n  Başlangıç adımı: yaklaşık ${o.a.toFixed(1)}–${o.b.toFixed(1)} g\n`;
    if (o.dis) out += "  ⚠ Formül dışı — metamerizm kontrolü şart (farklı ışıklarda bak).\n";
    if (o.t.not_recommended_usage) out += `  ⚠ Üretici uyarısı: ${o.t.not_recommended_usage}\n`;
  });
  if (!islem.length) out += "Hiçbir fark işaretlenmedi — 3. ve 4. kartlardan en az birine dokun.\n";
  const A = {}; kalemler.forEach(k => A[k.id] = k.gram);
  const ids = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();
  let topA = 0, topB = 0, satir = "";
  ids.forEach(id => {
    const a = A[id] || 0, b = B[id] || 0; topA += a; topB += b;
    if (b <= 0.05 && a > 0) return;
    const d = b - a, pct = a > 0 ? d / a * 100 : 0;
    const cls = Math.abs(d) < 0.05 ? "sabit" : d > 0 ? "art" : "aza";
    const ok = Math.abs(d) < 0.05 ? "=" : d > 0 ? "▲" : "▼";
    satir += `<tr class="${cls}"><td><b>${id}</b><br><small>${ALL[id]?.pigment_color || "?"}</small></td><td class="num">${a > 0 ? a.toFixed(1) : "—"}</td><td class="num">${b.toFixed(1)}</td><td class="num">${ok} ${Math.abs(d).toFixed(1)}</td><td class="num">${a > 0 ? (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%" : "YENİ"}</td></tr>`;
  });
  const dT = topB - topA;
  const tablo = `<table class="kars"><tr><th>Toner</th><th>A (mevcut)</th><th>B (aday)</th><th>Fark g</th><th>Fark %</th></tr>${satir}<tr class="top"><td><b>Toplam</b></td><td class="num">${topA.toFixed(1)}</td><td class="num">${topB.toFixed(1)}</td><td class="num">${dT >= 0 ? "+" : ""}${dT.toFixed(1)}</td><td class="num"></td></tr></table>`;
  const oran = id => (B[id] || 0) / topB * 100;
  if (oran("4110") + oran("4120") > 25) out += "⚠ 4110/4120 %25 limitini aşıyor — azalt.\n";
  if (oran("4000") > 35) out += "⚠ 4000 %35 limitini aşıyor — azalt.\n";
  if (islem.some(o => o.dis) || meta) out += "Metamerizm: formül-dışı toner eklendiğinde farklı ışıklarda (gün ışığı + atölye/LED) kontrol et. Garanti yok.\n";
  const ai = await geminiYorum(`Mevcut formül ${$("f-text").value}, tip ${tip}, istek: ön ${S.onY}/${S.onL}, alt ${S.altY}/${S.altL}, ışık ${isik}. Kısa yorum, gramaj uydurma.`);
  if (ai) out += "\n🤖 AI notu: " + ai;
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  $("sonuc").innerHTML = esc(out).replace(/\n/g, "<br>") + tablo;
  $("f2-text").value = Object.entries(B).filter(([, v]) => v > 0.05).map(([k, v]) => `${k} = ${v.toFixed(1)}`).join("\n");
};

// ---------- Karşılaştır + kaydet ----------
$("b-kars").onclick = () => {
  const bKalem = formuluOku($("f2-text").value).kalemler;
  if (!bKalem.length) { $("kars").textContent = "B kutusu boş — önce 'öneri üret'e bas (aday otomatik dolar) ya da gerçek karışımını yaz."; return; }
  const A = Object.fromEntries(formuluOku($("f-text").value).kalemler.map(k => [k.id, k.gram]));
  const Bm = Object.fromEntries(bKalem.map(k => [k.id, k.gram]));
  const ids = [...new Set([...Object.keys(A), ...Object.keys(Bm)])].sort();
  let topA = 0, topB = 0, satir = "";
  ids.forEach(id => {
    const a = A[id] || 0, b = Bm[id] || 0; topA += a; topB += b;
    const d = b - a, pct = a > 0 ? d / a * 100 : 0;
    const cls = Math.abs(d) < 0.005 ? "sabit" : d > 0 ? "art" : "aza";
    satir += `<tr class="${cls}"><td><b>${id}</b><br><small>${ALL[id]?.pigment_color || "?"}</small></td><td class="num">${a.toFixed(1)}</td><td class="num">${b.toFixed(1)}</td><td class="num">${Math.abs(d) < 0.005 ? "=" : (d > 0 ? "▲ +" : "▼ ") + d.toFixed(1)}</td><td class="num">${a > 0 ? (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%" : "YENİ"}</td></tr>`;
  });
  const dT = topB - topA;
  $("kars").innerHTML = `<table class="kars"><tr><th>Toner</th><th>A</th><th>B</th><th>Fark g</th><th>Fark %</th></tr>${satir}<tr class="top"><td><b>Toplam</b></td><td class="num">${topA.toFixed(1)}</td><td class="num">${topB.toFixed(1)}</td><td class="num">${dT >= 0 ? "+" : ""}${dT.toFixed(1)}</td><td class="num"></td></tr></table>`;
};
$("b-kaydet").onclick = () => {
  const k = { t: new Date().toISOString(), arac: $("f-car").value, formA: $("f-text").value, formB: $("f2-text").value };
  const a = JSON.parse(localStorage.getItem("renk-gecmis") || "[]"); a.push(k);
  localStorage.setItem("renk-gecmis", JSON.stringify(a));
  $("gecmis").textContent = a.length + " kayıt var. Son: " + k.t + " " + k.arac;
};
$("toner-q").addEventListener("input", e => {
  const q = e.target.value.toLocaleLowerCase("tr").trim();
  if (!q) { $("toner-sonuc").textContent = "Aramak için yaz."; return; }
  const bul = Object.values(ALL).filter(t => [t.toner_id, t.pigment_color, t.face_color, t.face_direction, t.flip_color, t.transparency, t.particle_size, t.technical_notes].filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q)).slice(0, 8);
  $("toner-sonuc").textContent = bul.length ? bul.map(t => `${t.toner_id}${t.alias_of ? " (=" + t.alias_of + ")" : ""}: ${t.pigment_color}, face ${t.face_color}/${t.face_direction || t.face_cleanliness || "?"}, flip ${t.flip_color}/${t.flip_lightness || "?"} — ${t.technical_notes}`).join("\n\n") : "Bulunamadı. Farklı kelime dene.";
});
fetch("../data/VERSION.json").then(r => r.json()).then(v => { $("surum").textContent = `Renk Ustası v${v.uygulama} • Veri v${v.veri} • ${v.not || ""}`; }).catch(() => {});
yukleDB();
