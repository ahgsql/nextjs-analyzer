# Next.js Analyzer Dil Sistemi Yol Haritası

Bu belge, Next.js Analyzer projesindeki tüm modüllerin dil desteği için güncellenmesi gereken adımları içerir.

## Genel Bakış

Next.js Analyzer'daki tüm modüllerin dil desteği için güncellenmesi gerekmektedir. Bu süreç, aşağıdaki adımları içerir:

1. Modül dosyasını inceleme ve sabit metinleri tespit etme
2. tr.js dosyasına çevirileri ekleme (İngilizce key, Türkçe değer)
3. Modül dosyasını i18n.t() fonksiyonunu kullanacak şekilde güncelleme

## Modül Listesi ve Durum

| Modül | Durum | Öncelik | Tahmini Süre |
|-------|-------|---------|--------------|
| component | ✅ Tamamlandı | Yüksek | - |
| code-quality | ✅ Tamamlandı | Yüksek | - |
| data-fetching |✅ Tamamlandı  | Yüksek | - |
| performance | ✅ Tamamlandı | Orta | - |
| security | ✅ Tamamlandı | Orta | - |
| seo | ✅ Tamamlandı | Orta | - |
| routing | ✅ Tamamlandı | Orta | - |
| history | ✅ Tamamlandı | Düşük | - |
| visualization | ⏳ Bekliyor | Düşük | 2 saat |

## Modül Güncelleme Adımları

Her modül için aşağıdaki adımları izleyin:

### 1. Modül Dosyasını İnceleme

```bash
# Modül dosyasını incele
cat src/modules/[module-name]/index.js
```

### 2. tr.js Dosyasını Güncelleme

tr.js dosyasına yeni bir bölüm ekleyin:

```javascript
// src/locales/tr.js
"[module-name]": {
  name: "[module-name]",
  description: "[Türkçe açıklama]",
  // ...diğer çeviriler
}
```

### 3. Modül Dosyasını Güncelleme

```javascript
// Önceki import ifadelerini güncelle
const { getRelativePath, i18n } = require('../../utils');

// Sabit metinleri i18n.t() ile değiştir
module.exports = {
  name: i18n.t('modules.[module-name].name'),
  description: i18n.t('modules.[module-name].description'),
  // ...diğer çeviriler
};
```

## Detaylı Modül Güncelleme Planı


1. **Tutarlı Anahtar İsimleri**: Tüm modüllerde tutarlı anahtar isimleri kullanın (örn: `title`, `description`, `recommendation` gibi).
2. **HTML ve Metin Formatları**: Görselleştirme fonksiyonlarında hem HTML hem de metin formatlarındaki tüm sabit metinleri çevirin.
3. **Değişken Kullanımı**: Değişken içeren metinlerde `{variableName}` formatını kullanın.

```bash
# Modülü test et
node bin/nextjs-analyzer.js analyze:module-name
```

5. **Dil Değiştirme Testi**: Dil değiştirme işlevini test edin:

```bash
# Dili değiştir
node bin/nextjs-analyzer.js settings
```

## Tamamlama Kriterleri

Dil sistemi entegrasyonu aşağıdaki kriterlere göre tamamlanmış sayılır:

1. Tüm modüllerdeki sabit metinler tr.js dosyasına eklenmiş
2. Tüm modül dosyaları i18n.t() fonksiyonunu kullanacak şekilde güncellenmiş
3. Dil değiştirme işlevi tüm modüllerde doğru çalışıyor
4. Tüm görselleştirme formatları (text, html, json) dil desteğine sahip
