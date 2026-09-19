# Backend (mimari madde 8)

## Neden var?
API anahtarı HTML'e konmaz. `key.local.js` sadece **tek-cihaz kişisel mod** içindir;
çok kullanıcı olunca anahtar buraya taşınır, `key.local.js` boşaltılır.

## Çalıştırma
```
GEMINI_KEY=AIza... node server.js
```

## Uçlar
- `GET /api/saglik` → `{ok:true}`
- `POST /api/ai` `{soru, baglam}` → `{cevap}` (Gemini'ye sunucudan gider)
- `GET /api/calismalar` → kullanıcı çalışmaları (db.json dosya-tabanlı, v1)
- `POST /api/calismalar` → yeni kayıt

## Sıradaki adım
Dosya-tabanlı `db.json` → gerçek veritabanı (mimari madde 7: Users/ColorWorks/AIUsage).
Kullanıcı doğrulama + günlük AI limiti buraya eklenir.
