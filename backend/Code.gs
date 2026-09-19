// Renk Ustası AI proxy — Google Apps Script
// Kurulum (5 dk):
//  1. script.google.com → Yeni proje → bu kodu yapıştır (Code.gs).
//  2. Proje Ayarları → Komut dosyası özellikleri → ekle:
//       GEMINI_KEY =AIza... (AI Studio ücretsiz anahtarın, kimse görmez)
//       KAPI = kendin-belirle-bir-sifre (telefonlar bunu sorar)
//  3. Yayınla → Web uygulaması olarak dağıt →
//       "Şu kişi olarak çalıştır: Ben", "Erişim: Herkes" → URL'yi kopyala.
//  4. URL + KAPI değerini uygulamadaki app/api-config.js dosyasına yaz.
// Anahtar ASLA telefona/HTML'e inmez; kota koruması dahili.
var MODEL = "gemini-2.0-flash";
var GUNLUK_LIMIT = 300;

function doGet() {
  return icerik({ ok: true, servis: "renk-ustasi-ai" });
}

function doPost(e) {
  try {
    var p = PropertiesService.getScriptProperties();
    var data = JSON.parse(e.postData.contents || "{}");
    if (String(data.sifre || "") !== String(p.getProperty("KAPI") || "")) {
      return icerik({ kod: 403, hata: "yetkisiz" });
    }
    var gun = new Date().toISOString().slice(0, 10);
    var anahtar = "KOTA_" + gun;
    var say = parseInt(p.getProperty(anahtar) || "0", 10);
    if (say >= GUNLUK_LIMIT) return icerik({ kod: 429, hata: "gunluk limit doldu" });
    var key = p.getProperty("GEMINI_KEY");
    if (!key) return icerik({ kod: 500, hata: "sunucuda anahtar yok" });

    var parts = [{ text: "Oto boya asistanısın. Kısa ve net cevap ver. Asla kesin gramaj uydurma, metamerizm garantisi verme. Bağlam: " + (data.baglam || "") + "\nSoru: " + (data.soru || "") }];
    if (data.resim && data.resim.data) {
      parts.push({ inline_data: { mime_type: data.resim.mime || "image/jpeg", data: data.resim.data } });
    }
    var r = UrlFetchApp.fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + encodeURIComponent(key),
      { method: "post", contentType: "application/json", payload: JSON.stringify({ contents: [{ parts: parts }] }), muteHttpExceptions: true }
    );
    p.setProperty(anahtar, String(say + 1));
    var j = JSON.parse(r.getContentText());
    var c = j.candidates || [];
    var txt = (c.length && c[0].content && c[0].content.parts && c[0].content.parts.length) ? c[0].content.parts[0].text : "";
    return icerik({ kod: 200, cevap: txt });
  } catch (err) {
    return icerik({ kod: 500, hata: String(err) });
  }
}

function icerik(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
