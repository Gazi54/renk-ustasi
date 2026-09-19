# Doğrulama kuyruğu (mimari madde 13)

Kullanıcının "bilgi bankasına katkı olarak gönder" dediği kayıtlar **doğrudan veriye eklenmez**.

## Akış
1. Kayıt `pending/` altına `YYYY-AA-GG-kisa-ad.json` olarak düşer.
2. İnceleyen (yönetici/renk uzmanı) kontrol eder:
   - Toner numaraları DB'de var mı? (yoksa esdegerlik mi, yeni toner mi?)
   - Binder limitleri uygun mu? (4110/4120 ≤%25, 4000 ≤%35)
   - Gözlem → düzeltme bağı mantıklı mı? (face/flip/yön PDF ile uyumlu mu?)
   - Tek deneyim genel kural gibi mi sunulmuş? (sunulmamalı)
3. Onaylanan `../2026-...json` olarak arşive geçer, veri sürümü (`data/VERSION.json`) +1.

## Format
`data/corrections/2026-09-19-gri-mor-metalik-v1.json` örnektir: orijinal +
düzeltilmiş formül, gözlem, teknik okuma (tahmin etiketli), sonuç.
