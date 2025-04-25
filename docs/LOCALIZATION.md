# Next.js Analyzer Dil Sistemi Teknik Dokümantasyonu

Bu dokümantasyon, Next.js Analyzer projesine eklenen dil sistemi (i18n) için teknik detayları ve kullanım kılavuzunu içerir.

## Genel Bakış

Next.js Analyzer, çoklu dil desteği için aşağıdaki bileşenleri kullanır:

- **src/locales/**: Dil dosyalarını içeren dizin
  - **tr.js**: Türkçe çeviriler
  - **en.js**: İngilizce çeviriler (varsayılan)
- **src/utils/i18n.js**: Dil yönetimi için yardımcı fonksiyonlar
- **src/utils/settings.js**: Kullanıcı ayarlarını yönetme (dil tercihi dahil)

## Dil Sistemi Mimarisi

```
src/
├── locales/
│   ├── tr.js       # Türkçe çeviriler
│   └── en.js       # İngilizce çeviriler (varsayılan)
├── utils/
│   ├── i18n.js     # Dil yönetimi
│   └── settings.js # Kullanıcı ayarları
└── cli/
    └── commands.js # Dil seçimi komutu
```

## Dil Dosyalarını Güncelleme Süreci

Yeni bir modül için dil desteği eklerken veya mevcut bir modülü güncellerken aşağıdaki adımları izleyin:

### 1. Modül Dosyasını İnceleme

İlk adım, ilgili modül dosyasını inceleyerek çevrilmesi gereken sabit metinleri tespit etmektir.

```javascript
// Örnek: src/modules/example/index.js dosyasını inceleyin
const exampleModule = {
  name: 'example',
  description: 'Bu bir örnek modüldür',
  // ...diğer sabit metinler
};
```

### 2. tr.js Dosyasını Güncelleme

Tespit edilen metinleri `src/locales/tr.js` dosyasına ekleyin. **Önemli**: Keyler İngilizce, değerler Türkçe olmalıdır.

```javascript
// src/locales/tr.js
module.exports = {
  // ...mevcut çeviriler
  modules: {
    // ...mevcut modüller
    example: {
      name: "example", // Key İngilizce, değer aynı kalabilir
      description: "Bu bir örnek modüldür", // Key İngilizce, değer Türkçe
      // ...diğer çeviriler
    }
  }
};
```

### 3. Değişken Kullanımı

Metinlerde değişken kullanmak için `{variableName}` sözdizimini kullanın:

```javascript
// tr.js dosyasında
filesFound: "{count} dosya bulundu."

// Kullanımı
i18n.t('analyzer.messages.filesFound', { count: 42 }) // "42 dosya bulundu."
```

### 4. Modül Dosyasını Güncelleme

Modül dosyasındaki sabit metinleri `i18n.t()` fonksiyonu ile değiştirin:

```javascript
// Önceki hali
const exampleModule = {
  name: 'example',
  description: 'Bu bir örnek modüldür',
  // ...
};

// Güncellenmiş hali
const { i18n } = require('../../utils');

const exampleModule = {
  name: i18n.t('modules.example.name'),
  description: i18n.t('modules.example.description'),
  // ...
};
```

## Dil Sistemi Fonksiyonları

### i18n.t(key, params)

Belirtilen anahtara göre çeviriyi döndürür.

- **key**: Çeviri anahtarı (dot notation, örn: 'common.error')
- **params**: Çeviride kullanılacak parametreler (opsiyonel)

```javascript
// Basit kullanım
i18n.t('common.error') // "Hata"

// Parametreli kullanım
i18n.t('analyzer.messages.filesFound', { count: 5 }) // "5 dosya bulundu."
```

### i18n.getCurrentLanguage()

Mevcut dili döndürür.

```javascript
const currentLang = i18n.getCurrentLanguage(); // "tr" veya "en"
```

### i18n.setLanguage(language)

Dili değiştirir ve ayarlara kaydeder.

```javascript
i18n.setLanguage('tr'); // Türkçe'ye geçiş yapar
```

### i18n.getAvailableLanguages()

Kullanılabilir dilleri döndürür.

```javascript
const languages = i18n.getAvailableLanguages();
// { tr: 'Türkçe', en: 'English' }
```

## Dil Dosyası Yapısı

Dil dosyaları, anahtar-değer çiftleri şeklinde hiyerarşik bir yapıya sahiptir:

```javascript
module.exports = {
  common: {
    error: "Hata",
    success: "Başarılı",
    // ...
  },
  cli: {
    // CLI ile ilgili çeviriler
  },
  analyzer: {
    // Analyzer ile ilgili çeviriler
  },
  modules: {
    // Modüller ile ilgili çeviriler
    component: {
      // Component modülü çevirileri
    },
    "data-fetching": {
      // Data fetching modülü çevirileri
    },
    // ...diğer modüller
  }
};
```

## Yeni Bir Modül İçin Dil Desteği Ekleme Örneği

1. Modül dosyasını inceleyin ve sabit metinleri tespit edin
2. tr.js dosyasına yeni bir bölüm ekleyin:

```javascript
// src/locales/tr.js
"new-module": {
  name: "new-module",
  description: "Yeni modül açıklaması",
  types: {
    "some-type": "Bir tür"
  },
  visualize: {
    title: "Görselleştirme Başlığı",
    noData: "Veri bulunamadı."
  }
}
```

3. Modül dosyasını güncelleyin:

```javascript
// src/modules/new-module/index.js
const { i18n } = require('../../utils');

module.exports = {
  name: i18n.t('modules.new-module.name'),
  description: i18n.t('modules.new-module.description'),
  
  // ...
  
  visualize: {
    text(results) {
      let output = `# ${i18n.t('modules.new-module.visualize.title')}\n\n`;
      
      if (results.data.length === 0) {
        output += `${i18n.t('modules.new-module.visualize.noData')}\n`;
      }
      
      // ...
      
      return output;
    }
  }
};
```

## Önemli Notlar

1. **Sadece tr.js Dosyasını Güncelleyin**: en.js dosyası daha sonra tr.js'den çevrilecektir.
2. **Key'ler İngilizce Olmalı**: Tüm anahtarlar İngilizce, değerler Türkçe olmalıdır.
3. **Tutarlı Yapı**: Dil dosyalarında tutarlı bir hiyerarşik yapı kullanın.
4. **Değişken Kullanımı**: Değişkenler için `{variableName}` sözdizimini kullanın.
5. **Modül Güncellemesi**: Modül dosyasını güncellerken, tüm sabit metinleri `i18n.t()` fonksiyonu ile değiştirin.
