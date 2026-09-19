# PDF ekleme prosedürü (mimari madde 15)

Kod değiştirmeden yeni doküman ekleme adımları:

1. PDF'i `documents/` altına koy (örn. `documents/ppg-xyz.pdf`).
2. Her toner için `schemas/toner.schema.json` alanlarını doldurup
   `data/toners/<sistem>.json` dosyasına ekle:
   - face rengi/yönü/temizliği, flip rengi/açıklığı/değişimi
   - şeffaf/örtücü, solid/efekt kullanımı, partikül, binder limiti
   - `technical_notes` = doküman cümlesinin özeti (uydurma yok)
   - `source_document` + `source_page` zorunlu
3. Dokümanda OLMAYAN alanı `null` bırak (RGB/LAB uydurma).
4. Numara değişimi varsa `renumber-aliases.json`'a esdegerlik ekle.
5. `data/VERSION.json` → veri +0.1. Uygulama değişmeden yeni bilgi yayına girer.
