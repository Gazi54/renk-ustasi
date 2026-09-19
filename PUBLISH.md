# GitHub Pages yayını (15 dk, ücretsiz)

## 1. Apps Script backend (anahtar bir kez, oraya)
1. `backend/Code.gs` içeriğini script.google.com'da yeni projeye yapıştır.
2. Proje Ayarları → Komut dosyası özellikleri:
   - `GEMINI_KEY` = AI Studio anahtarın
   - `KAPI` = kendin bir şifre uydur (örn. `usta-2026`)
3. Yayınla → Web uygulaması olarak dağıt → "Şu kişi olarak çalıştır: **Ben**", "Erişim: **Herkes**".
4. URL'yi kopyala (`.../exec`).

## 2. Repo hazırla
```
app/api-config.js → BACKEND_URL + KAPI yaz (git'e GİRMEZ, .gitignore'da)
app/key.local.js → BOŞ bırak (anahtarı sil!)
```
Kontrol: `git status` içinde `api-config.js` ve `key.local.js` görünmemeli.

## 3. GitHub'a at + Pages aç
1. github.com → New repository → `renk-ustasi` (Public).
2. Bu klasörün tamamını yükle (web'den Add file → Upload veya git push).
3. Repo → Settings → Pages → Source: **Deploy from a branch** → Branch: **main / (root)** → Save.
4. 1-2 dk sonra adres: `https://KULLANICI.github.io/renk-ustasi/app/`

## 4. Telefonda kur
Adresi aç → tarayıcı menüsü → **Ana ekrana ekle** → simge oluşur.
AI kutusuna artık hiçbir şey yazılmaz — backend cevap verir.
PC kapalı olsa da çalışır (sayfa + veri GitHub'da, AI Apps Script'te).

## Güvenlik notları
- `GEMINI_KEY` yalnızca Script Properties'te durur, kimse görmez.
- `KAPI` kaynakta görünür; amatör kullanımı engeller. Gerçek koruma
  Code.gs içindeki **günlük 300 istek kotasıdır**. Anormal kullanımda
  KAPI'yı değiştir + yeni sürüm dağıt (1 dk).
- `db.json`/çalışma geçmişi bu sürümde telefondadır (localStorage);
  sunucu kaydı sonraki aşama (Sheets entegrasyonu).
