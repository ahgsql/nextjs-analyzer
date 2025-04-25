# Katkıda Bulunma Rehberi

Next.js Analyzer projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Bu rehber, projeye nasıl katkıda bulunabileceğinizi açıklar.

## Geliştirme Ortamı Kurulumu

1. Projeyi fork edin ve klonlayın:

```bash
git clone https://github.com/[kullanıcı-adınız]/next-js-analyzer.git
cd next-js-analyzer
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Projeyi yerel olarak çalıştırın:

```bash
npm start
```

## Modüler Yapı

Next.js Analyzer, modüler bir yapıya sahiptir. Her analiz modülü, `src/modules` dizini altında kendi klasöründe bulunur. Yeni bir modül eklemek için bu yapıyı takip edin.

### Modül Yapısı

Bir modül, aşağıdaki yapıya sahip olmalıdır:

```javascript
module.exports = {
  name: 'module-name',
  description: 'Module description',
  
  async analyze(analyzer, options) {
    // Analiz işlemi
    return {
      results: {
        // Analiz sonuçları
      },
      metadata: {
        // Analiz meta verileri
      }
    };
  },
  
  visualize: {
    text(results) {
      // Metin formatında görselleştirme
      return 'Text visualization';
    },
    
    html(results) {
      // HTML formatında görselleştirme
      return '<div>HTML visualization</div>';
    },
    
    json(results) {
      // JSON formatında görselleştirme
      return JSON.stringify(results, null, 2);
    }
  }
};
```

## Yeni Bir Modül Ekleme

1. `src/modules` dizini altında yeni bir klasör oluşturun:

```bash
mkdir src/modules/your-module-name
```

2. `src/modules/your-module-name/index.js` dosyasını oluşturun ve modül yapısını takip edin.

3. Modülünüzü `src/modules/index.js` dosyasına ekleyin:

```javascript
const component = require('./component');
const performance = require('./performance');
const security = require('./security');
const seo = require('./seo');
const dataFetching = require('./data-fetching');
const codeQuality = require('./code-quality');
const routing = require('./routing');
const visualization = require('./visualization');
const history = require('./history');
const yourModuleName = require('./your-module-name');

module.exports = {
  component,
  performance,
  security,
  seo,
  'data-fetching': dataFetching,
  'code-quality': codeQuality,
  routing,
  visualization,
  history,
  'your-module-name': yourModuleName
};
```

4. Modülünüzü test edin:

```bash
npm start analyze --module your-module-name
```

## Kod Stili

Projeye katkıda bulunurken aşağıdaki kod stiline uyun:

- 2 boşluk girinti kullanın
- Noktalı virgül kullanın
- Tek tırnak kullanın
- camelCase değişken ve fonksiyon isimleri kullanın
- JSDoc ile fonksiyonları belgelendirin

## Commit Mesajları

Commit mesajlarınızı aşağıdaki formatta yazın:

```
[modül-adı]: Kısa açıklama

Uzun açıklama (gerekirse)
```

Örnek:

```
[security]: API route güvenlik kontrolü eklendi

- CORS yapılandırması kontrolü eklendi
- Rate limiting kontrolü eklendi
- Authentication kontrolü eklendi
```

## Pull Request Süreci

1. Yeni bir branch oluşturun:

```bash
git checkout -b feature/your-feature-name
```

2. Değişikliklerinizi commit edin:

```bash
git commit -m "[module-name]: Short description"
```

3. Branch'inizi push edin:

```bash
git push origin feature/your-feature-name
```

4. GitHub üzerinden bir Pull Request oluşturun.

5. Pull Request'iniz incelenecek ve gerekirse değişiklikler istenecektir.

6. Pull Request'iniz onaylandıktan sonra, değişiklikleriniz ana branch'e merge edilecektir.

## Sorunlar ve Özellik İstekleri

Sorunları ve özellik isteklerini GitHub Issues üzerinden bildirebilirsiniz. Lütfen aşağıdaki şablonu kullanın:

### Sorun Bildirimi

```
## Sorun Açıklaması
[Sorunu kısaca açıklayın]

## Yeniden Üretme Adımları
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

## Beklenen Davranış
[Beklenen davranışı açıklayın]

## Gerçek Davranış
[Gerçek davranışı açıklayın]

## Ortam
- İşletim Sistemi: [İşletim sistemi]
- Node.js Sürümü: [Node.js sürümü]
- Next.js Analyzer Sürümü: [Next.js Analyzer sürümü]
```

### Özellik İsteği

```
## Özellik Açıklaması
[Özelliği kısaca açıklayın]

## Kullanım Senaryosu
[Bu özelliğin nasıl kullanılacağını açıklayın]

## Alternatif Çözümler
[Varsa, alternatif çözümleri açıklayın]
```

## Lisans

Projeye katkıda bulunarak, katkılarınızın MIT lisansı altında lisanslanacağını kabul etmiş olursunuz.
