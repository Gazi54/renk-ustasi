# Oto Boya Renk Düzeltme Asistanı (bağımsız)

Bağımsız mobil PWA. Mevcut hiçbir uygulamaya bağlı değildir.

## Kaynak hiyerarşisi
1. `data/toners/dynacoat-MM-*.json` — Dynacoat Basecoat MM üretici dokümanı (20.04.2015, Rusça PDF, www.dynacoat.ru). Güven: YÜKSEK.
2. Kullanıcının doğruladığı düzeltme kayıtları (localStorage → sonra `data/corrections/`).
3. AI tahmini — her zaman "tahmin" olarak etiketlenir, gramaj uydurulmaz.

## Yapı
- `schemas/` — toner veri modeli (bölüm 4).
- `data/toners/` — PDF'den birebir aktarım (face/flip/yön/şeffaf/partikül/binder limitleri).
- `data/rules/correction-policy.json` — formül-içi öncelik + metamerizm koruma + soru dallanma.
- `app/` — mobil arayüz (15 adımlı akışın ilk sürümü: formül → tip → genel/face/flop → efekt/ışık → analiz → A/B → kaydet).

## Çalıştırma
Statik dosya — `app/index.html`'i bir http sunucuyla açın (fetch için `file://` yetmez):
`python -m http.server` → `/paint-color-ai/app/`

## Önemli kurallar (koda gömülü)
- İlk mesajdan toner önerilmez; önce formül onayı + soru ağacı.
- Kesin gramaj yok ("0,35 g ekle" yasak); kontrollü küçük deneme.
- "Bu kesin metamerizm yapmaz" cümlesi yasak.
- RGB yalnızca görsel yardımcı; LAB/ΔE alanı hazır.
- Solid tipte flop soruları azaltılır; metalik/sedefte face/flop/partikül açılır.
- Binder limitleri: 4110/4120 ≤ %25, 4000 ≤ %35 (dokümandan).
