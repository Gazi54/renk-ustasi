// DELTA DÜZELTME — cihaz değerinden toner önerisi (Mixit bağımsız, TAHMİNİ)
// ΔE: CIE76. Yön kuralları Dynacoat MM PDF + saha kayıtları.
const $ = id => document.getElementById(id);
const ALL = {}; (window.TONER_DATA || []).forEach(t => ALL[t.toner_id] = t);
const ACILAR = ["25", "45", "110"];
const AD = { "25": "ön", "45": "orta", "110": "yan" };
const num = id => parseFloat(($(id).value || "").replace(",", "."));

function hueAile(a, b) {
  let h = Math.atan2(b, a) * 180 / Math.PI; if (h < 0) h += 360;
  if (h < 20 || h >= 340) return "kırmızı"; if (h < 45) return "turuncu"; if (h < 75) return "sarı";
  if (h < 165) return "yeşil"; if (h < 260) return "mavi"; return "mor";
}
function okuFormul() {
  const out = [];
  ($("d-form").value || "").split("\n").forEach(s => {
    const m = s.match(/\b(4\d{3})\b[^\d]{0,40}(\d+[.,]\d+|\d+)/);
    if (m) out.push({ id: m[1], gram: parseFloat(m[2].replace(",", ".")) });
  });
  return out;
}
const havuz = t => ((t.face_color || "") + " " + (t.face_direction || "") + " " + (t.flip_color || "")).toLocaleLowerCase("tr");

// ---------- Fotoğraftan okuma: AI yerleştirir, kullanıcı doğrular ----------
const gemKey = () => ((window.GEMINI_KEY || "").trim() || localStorage.getItem("gem-key") || "");
async function ocrMetin(file) {
  const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(",")[1]); fr.readAsDataURL(file); });
  const SORU = "Bu görüntüdeki tüm yazıları ve sayıları satır satır aynen yaz. Tabloysa satır düzenini koru.";
  const b = await backendIste(SORU, "", { mime: file.type || "image/jpeg", data: b64 });
  if (b) return b;
  const k = gemKey();
  if (k) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${k}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: SORU }, { inline_data: { mime_type: file.type || "image/jpeg", data: b64 } }] }] })
      });
      const j = await r.json();
      const t = j.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (t) return t;
    } catch (e) {}
  }
  const r = await Tesseract.recognize(file, "tur+eng", { tessedit_pageseg_mode: "6" });
  return r.data.text;
}
$("d-ocr-form").onclick = async () => {
  const f = $("d-foto-form").files[0];
  if (!f) { alert("Önce fotoğraf seç."); return; }
  $("d-sonuc").textContent = "Okunuyor...";
  let metin = "";
  try { metin = await ocrMetin(f); } catch (e) { metin = ""; }
  const bul = [...metin.matchAll(/\b(4\d{3})\b[^\d]{0,40}(\d+[.,]\d+|\d+)/g)];
  if (!bul.length) { $("d-sonuc").textContent = "Formül bulunamadı. Ham metin:\n" + metin.slice(0, 800); return; }
  const gor = new Set(); const sat = [];
  bul.forEach(m => { if (!gor.has(m[1])) { gor.add(m[1]); sat.push({ id: m[1], g: parseFloat(m[2].replace(",", ".")) }); } });
  // Toplam etiketi varsa ölçeği ona uydur (virgül yutulması 10x hatasını düzeltir)
  let not = "";
  const top = metin.match(/toplam[^0-9]{0,30}(\d+[.,]\d+)/i);
  const hamTop = sat.reduce((a, s) => a + s.g, 0);
  if (top) {
    const hedef = parseFloat(top[1].replace(",", "."));
    if (hedef > 0 && Math.abs(hamTop - hedef) / hedef > 0.05) {
      sat.forEach(s => s.g = s.g * hedef / hamTop);
      not = `\n⚖ Toplam etikete göre ölçeklendi (ham ${hamTop.toFixed(0)} → ${hedef} g).`;
    }
  }
  $("d-form").value = sat.map(s => `${s.id} = ${s.g.toFixed(1)}`).join("\n");
  $("d-sonuc").textContent = `Fotoğraftan ${sat.length} satır okundu — KONTROL ET, eksik satır varsa elle ekle:${not}\n` + sat.map(s => `${s.id} = ${s.g.toFixed(1)}`).join("\n");
};
$("d-ocr-lab").onclick = async () => {
  const f = $("d-foto-lab").files[0];
  if (!f) { alert("Önce fotoğraf seç."); return; }
  $("d-ocr-ham").textContent = "Okunuyor...";
  let metin = "";
  try { metin = await ocrMetin(f); } catch (e) { metin = ""; }
  const ham = $("d-ocr-ham");
  ham.textContent = "OCR ham metin (kontrol et):\n" + (metin || "(boş)").slice(0, 1200);
  let bolum = "fark", refN = 0, ornN = 0;
  const deltaSat = {}, supheliler = [];
  metin.split("\n").map(s => s.trim()).filter(Boolean).forEach(s => {
    const k = s.toLocaleLowerCase("tr");
    if (k.includes("referans")) { bolum = "ref"; return; }
    if (k.includes("örnek")) { bolum = "orn"; return; }
    const m = s.match(/^(25|45|110)\b/);
    if (!m) return;
    // OCR tamiri: "*1027"→-10.27 ; "1251"→12.51 (virgülsüz 3-5 haneye sona 2 kala virgül)
    // Tamir gören kutular şüpheli işaretlenir — kullanıcı doğrular.
    const dec = [];
    s.split(/\s+/).slice(1).forEach(w => {
      let neg = false, sup = false;
      if (/^[*\-–]/.test(w)) { neg = true; sup = true; w = w.replace(/^[*\-–]/, ""); }
      const m2 = w.match(/(\d+)[.,](\d+)/);
      if (m2) { const v = parseFloat(m2[1] + "." + m2[2]); dec.push({ v: neg ? -v : v, sup }); return; }
      const d = w.replace(/\D/g, "");
      if (d.length >= 3 && d.length <= 5) { const v = parseFloat(d.slice(0, -2) + "." + d.slice(-2)); dec.push({ v: neg ? -v : v, sup: true }); }
    });
    if (dec.length === 6 && bolum === "fark") { deltaSat[m[1]] = dec.map(x => x.v); return; }
    if (dec.length < 4) return; // en az L,a,b olmalı
    const pre = bolum === "ref" ? "r" : "s";
    const eksikSayi = dec.length < 5;
    try {
      [["L", 0], ["a", 1], ["b", 2]].forEach(([h, i]) => {
        const el = $(`${pre}-${h}-${m[1]}`);
        el.value = dec[i].v;
        el.classList.toggle("supheli", dec[i].sup || eksikSayi);
        if (dec[i].sup || eksikSayi) supheliler.push(`${pre}-${h}-${m[1]}`);
      });
    } catch (e) {}
    if (bolum === "ref") refN++; else ornN++;
  });
  ham.textContent += `\n\nYerleştirilen: referans ${refN}, örnek ${ornN} satır.`;
  const ac = Object.keys(deltaSat).sort();
  if (ac.length) ham.textContent += `\nMixit delta satırları (karşılaştır): ` + ac.map(g => `${g}° ΔE=${deltaSat[g][0]} ΔL=${deltaSat[g][1]} Δa=${deltaSat[g][2]} Δb=${deltaSat[g][3]}`).join(" | ");
  if (supheliler.length) ham.textContent += `\n⚠ TURUNCU kutular tamir gördü (işaret/virgül) — ham metinle karşılaştırıp doğrula: ` + [...new Set(supheliler)].join(", ");
  else ham.textContent += `\nKONTROL ET — yanlış kutuyu elle düzelt, sonra hesapla.`;
  // geri-okuma: kutularda gerçekten ne var?
  const dolu = [];
  ["r", "s"].forEach(p => ["25", "45", "110"].forEach(g => { if ($(p + "-L-" + g).value !== "" && $(p + "-a-" + g).value !== "" && $(p + "-b-" + g).value !== "") dolu.push(p + "-" + g); }));
  ham.textContent += `\nKutularda hazır açılar: ` + (dolu.length ? dolu.join(", ") : "hiçbiri — eksikleri elle yaz");
};

$("d-ornek").onclick = () => {
  const R = { "25": [91.79, -10.27, 12.51], "45": [60.92, -8.06, 8.66], "110": [25.05, -6.74, 5.84] };
  const S = { "25": [104.71, -10.87, 12.68], "45": [52.32, -8.89, 7.66], "110": [24.01, -11.54, 7.15] };
  ACILAR.forEach(g => {
    $("r-L-" + g).value = R[g][0]; $("r-a-" + g).value = R[g][1]; $("r-b-" + g).value = R[g][2];
    $("s-L-" + g).value = S[g][0]; $("s-a-" + g).value = S[g][1]; $("s-b-" + g).value = S[g][2];
  });
  $("d-form").value = "4003 = 49.4\n4248 = 0.4\n4456 = 1.0\n4800 = 1.9\n4545 = 2.1\n4110 = 12.6\n4000 = 28.9";
  $("d-sonuc").textContent = "Örnek yüklendi — 'Delta hesapla'ya bas. (Gerçek Mixit vakası: yeşil-sarı metalik.)";
};
$("d-hesap").onclick = () => {
  if (!Object.keys(ALL).length) { $("d-sonuc").textContent = "Toner verisi yok."; return; }
  const efektli = $("d-tip").value !== "solid";
  const kalemler = okuFormul();
  if (!kalemler.length) { $("d-sonuc").textContent = "Önce formülü yaz."; return; }
  const formda = kalemler.map(k => k.id);
  const toplam = parseFloat($("d-toplam").value) || kalemler.reduce((a, k) => a + k.gram, 0) || 100;
  const uygun = t => {
    if (!t || t.pigment_family === "binder") return true;
    if (efektli) return t.effect_usage !== false;
    return t.solid_usage !== false;
  };
  // --- delta hesabı ---
  let out = "DELTA (örnek − referans; + = örneğin fazla olduğu yön):\n";
  const hata = [];
  ACILAR.forEach(g => {
    const rL = num(`r-L-${g}`), ra = num(`r-a-${g}`), rb = num(`r-b-${g}`);
    const sL = num(`s-L-${g}`), sa = num(`s-a-${g}`), sb = num(`s-b-${g}`);
    if ([rL, ra, rb, sL, sa, sb].some(isNaN)) { out += `${g}°: eksik değer\n`; return; }
    const dL = sL - rL, da = sa - ra, db = sb - rb;
    const Cr = Math.hypot(ra, rb), Cs = Math.hypot(sa, sb), dC = Cs - Cr;
    const dE = Math.hypot(dL, da, db);
    const dH = Math.sqrt(Math.max(0, dE * dE - dL * dL - dC * dC));
    const karar = dE < 1 ? "✓ iyi" : dE <= 2 ? "≈ sınırda" : "✗ düzelt";
    out += `${g}° (${AD[g]}): ΔE=${dE.toFixed(2)} ${karar} | ΔL=${dL >= 0 ? "+" : ""}${dL.toFixed(2)} Δa=${da >= 0 ? "+" : ""}${da.toFixed(2)} Δb=${db >= 0 ? "+" : ""}${db.toFixed(2)} | ΔC=${dC >= 0 ? "+" : ""}${dC.toFixed(2)} ΔH≈${dH.toFixed(2)}\n`;
    hata.push({ g, dE, dL, da, db, dC, refAile: hueAile(ra, rb) });
  });
  if (!hata.length) { $("d-sonuc").textContent = out + "\nEn az bir açıyı eksiksiz doldur."; return; }
  const wade = hata.reduce((a, h) => a + h.dE, 0) / hata.length;
  out += `Basit ortalama: ${wade.toFixed(2)} (eşik: <1 iyi, >2 işlem)\n`;
  // --- en kötü açıdan öneri ---
  const kotu = [...hata].sort((a, b) => b.dE - a.dE)[0];
  out += `\nÖncelik: ${kotu.g}° (${AD[kotu.g]} açı, ΔE=${kotu.dE.toFixed(2)})\n\nÖNERİ:\n`;
  const B = {}; kalemler.forEach(k => B[k.id] = k.gram);
  const yapildi = new Set();
  const R = r => [toplam * r[0], toplam * r[1], toplam * (r[0] + r[1]) / 2];
  const adim = [];
  const kayit = (t, is, oran, neden, dis) => {
    const anahtar = t.toner_id + "/" + is;
    if (yapildi.has(anahtar)) return;
    // aynı renk ailesi kısılırken ters yöne ekleme yapma (açı çelişkisi koruması)
    if (dis && [...yapildi].some(y => { const p = y.split("/"); return p[1] === "Azalt" && ALL[p[0]] && ALL[p[0]].pigment_color === t.pigment_color; })) return;
    yapildi.add(anahtar);
    const [a, b, o] = R(oran);
    B[t.toner_id] = Math.max(0, (B[t.toner_id] || 0) + (is === "Azalt" ? -o : o));
    adim.push(`${t.toner_id} ${is} (${t.face_color}${t.face_direction ? "/" + t.face_direction : ""}) — ${neden} Başlangıç: ${a.toFixed(1)}–${b.toFixed(1)} g${dis ? " ⚠ formül dışı" : ""}`);
  };
  const yonDuzelt = (kokEkle, kokKis, etiket) => {
    // formülde fazla yöne çeken varsa kıs, eksik yönün toneri yoksa ekle
    const kisen = Object.values(ALL).filter(t => uygun(t) && formda.includes(t.toner_id) && havuz(t).includes(kokKis) && !["4000", "4110", "4120", "4010", "4200", "4800", "4840", "4198"].includes(t.toner_id)).slice(0, 1);
    kisen.forEach(t => kayit(t, "Azalt", [0.003, 0.008], `${etiket}: ${kokKis} yön fazla.`));
    const eksik = Object.values(ALL).filter(t => uygun(t) && !formda.includes(t.toner_id) && (t.pigment_color || "").includes(kokEkle)).sort((a, b) => ((b.face_cleanliness || "").startsWith("temiz") ? 1 : 0) - ((a.face_cleanliness || "").startsWith("temiz") ? 1 : 0)).slice(0, 1);
    if (!kisen.length) eksik.forEach(t => kayit(t, "Ekle", [0.002, 0.005], `${etiket}: ${kokEkle} yön eksik.`, true));
  };
  const e = (v, esik) => Math.abs(v) >= esik ? Math.sign(v) : 0;
  // açıklık (en kötü açının ΔL'si). ΔL+ ise ÖNCE örtücü açıcıları kıs (cihaz pratiği), sonra siyah
  if (e(kotu.dL, 1) > 0) {
    kalemler.map(k => ALL[k.id]).filter(t => t && uygun(t) && t.transparency === "ortucu" && /beyaz|sarı|turuncu/.test((t.face_color || "") + (t.pigment_color || ""))).slice(0, 2).forEach(t => kayit(t, "Azalt", [0.004, 0.01], "ΔL+ : örtücü açıcı kıs."));
    const kb = ALL["4800"]; formda.includes("4800") ? kayit(kb, "Artır", [0.004, 0.01], "ΔL+ : örnek açık.") : kayit(kb, "Ekle", [0.002, 0.005], "ΔL+ : örnek açık.", true); if (formda.includes("4100")) kayit(ALL["4100"], "Azalt", [0.003, 0.008], "ΔL+ : açıcı kıs.");
  }
  if (e(kotu.dL, 1) < 0) { const w = ALL[efektli ? "4100" : "4200"]; formda.includes(w.toner_id) ? kayit(w, "Artır", [0.004, 0.01], "ΔL− : örnek koyu.") : kayit(w, "Ekle", [0.002, 0.005], "ΔL− : örnek koyu.", true); }
  // renk eksenleri — en kötü açı + ΔE>1.5 olan her açı (eşik 0.5)
  hata.filter(h => h.dE > 1.5).forEach(h => {
    if (e(h.da, 0.5) > 0) yonDuzelt("yeşil", "kırmızı", `Δa+ ${h.g}°: örnek kırmızı.`);
    if (e(h.da, 0.5) < 0) yonDuzelt("kırmızı", "yeşil", `Δa− ${h.g}°: örnek yeşil.`);
    if (e(h.db, 0.5) > 0) yonDuzelt("mavi", "sarı", `Δb+ ${h.g}°: örnek sarı.`);
    if (e(h.db, 0.5) < 0) yonDuzelt("sarı", "mavi", `Δb− ${h.g}°: örnek mavi.`);
  });
  // canlılık
  if (e(kotu.dC, 1) < 0) {
    const kirli = kalemler.map(k => ALL[k.id]).filter(t => t && (t.face_cleanliness || "").includes("kirli")).slice(0, 1);
    kirli.forEach(t => kayit(t, "Azalt", [0.003, 0.008], "ΔC− : örnek kirli."));
  }
  if (!adim.length) out += "Tüm eksenler eşik altında — işlem gerekmeyebilir (gözle doğrula).\n";
  else out += adim.map((a, i) => `${i + 1}. ${a}`).join("\n") + "\n";
  const A = {}; kalemler.forEach(k => A[k.id] = k.gram);
  let topA = 0, topB = 0, satir = "";
  [...new Set([...Object.keys(A), ...Object.keys(B)])].sort().forEach(id => {
    const a = A[id] || 0, b = B[id] || 0;
    if (b <= 0.02 && a > 0) return;
    topA += a; topB += b;
    const d = b - a, pct = a > 0 ? d / a * 100 : 0;
    const cls = Math.abs(d) < 0.02 ? "sabit" : d > 0 ? "art" : "aza";
    satir += `<tr class="${cls}"><td><b>${id}</b><br><small>${ALL[id]?.pigment_color || "?"}</small></td><td class="num">${a > 0 ? a.toFixed(1) : "—"}</td><td class="num">${b.toFixed(1)}</td><td class="num">${Math.abs(d) < 0.02 ? "=" : (d > 0 ? "▲ +" : "▼ ") + d.toFixed(1)}</td><td class="num">${a > 0 ? (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%" : "YENİ"}</td></tr>`;
  });
  const dT = topB - topA;
  const tablo = `<table class="kars"><tr><th>Toner</th><th>A (mevcut)</th><th>B (aday)</th><th>Fark g</th><th>Fark %</th></tr>${satir}<tr class="top"><td><b>Toplam</b></td><td class="num">${topA.toFixed(1)}</td><td class="num">${topB.toFixed(1)}</td><td class="num">${dT >= 0 ? "+" : ""}${dT.toFixed(1)}</td><td class="num"></td></tr></table>`;
  out += "\n\nNot: eksen çelişirse (bir açı aç, öteki koyult diyorsa) en kötü açıdan başla, tek turda hepsini kapatmaya çalışma. Farklı ışıkta kontrol et.";
  // --- sade dilde açıklama (katlanabilir) ---
  const cumle = h => {
    if (h.dE < 1) return `${h.g}° (${AD[h.g]}): fark yok, bu açı tamam.`;
    let s = `${h.g}° (${AD[h.g]}): fark ${h.dE.toFixed(1)} — ${h.dE <= 2 ? "sınırda, gözle karar ver." : "düzeltme gerek. "}`;
    if (Math.abs(h.dL) >= 1) s += h.dL > 0 ? `Seninki ${h.dL.toFixed(1)} birim AÇIK → koyultmak lazım. ` : `Seninki ${Math.abs(h.dL).toFixed(1)} birim KOYU → açmak lazım. `;
    if (Math.abs(h.da) >= 0.5) s += h.da > 0 ? "KIRMIZIYA kaymış. " : "YEŞİLE kaymış. ";
    if (Math.abs(h.db) >= 0.5) s += h.db > 0 ? "SARIYA kaymış. " : "MAVİYE kaymış. ";
    if (h.dC <= -1) s += "Referanstan daha KİRLİ/mat görünüyor. ";
    return s;
  };
  let acik = `<details class="acik"><summary>🔍 Sade dille anlat (dokunarak aç)</summary>`;
  if (hata.some(h => h.dE > 12 || Math.abs(h.dL) > 15 || Math.abs(h.da) > 15 || Math.abs(h.db) > 15))
    acik += `<b>⚠ Değerler olağandışı büyük — önce kutuları ham metinle karşılaştır. Eksi işareti yutulmuş olabilir; yanlış girişten çıkan öneri yanlış olur.</b><br><br>`;
  acik += `Önce ${kotu.g}° düzelir, çünkü fark en büyük orada. Tek turda her açıyı kapatmaya çalışma.<br><br>`;
  acik += hata.map(cumle).join("<br>");
  acik += `<br><br><small>ΔL = açıklık (+açık / −koyu) • Δa = kırmızı(+) / yeşil(−) • Δb = sarı(+) / mavi(−) • ΔC eksi = kirli • ΔE 1'in altı iyi.</small></details>`;
  $("d-sonuc").innerHTML = out.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>") + tablo + acik;
};
