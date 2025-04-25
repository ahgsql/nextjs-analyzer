# Next.js Analyzer

Next.js projelerini kapsamlı olarak analiz eden modüler bir araç. Komponent, performans, güvenlik, SEO, veri çekme, kod kalitesi ve tarihsel analiz özellikleri içerir.

![Next.js Analyzer](https://via.placeholder.com/800x400?text=Next.js+Analyzer)

## Özellikler

- **Komponent Analizi**: Server ve client komponentlerin tespiti ve analizi
- **Performans Analizi**: Bundle size ve image optimizasyon kontrolü
- **Güvenlik Analizi**: Server komponentlerde ve API route'larda güvenlik kontrolü
- **SEO Analizi**: Meta tag ve semantik HTML kontrolü
- **Veri Fetching Analizi**: getServerSideProps, getStaticProps ve client-side veri çekme yöntemlerinin analizi
- **Kod Kalitesi Analizi**: Kullanılmayan komponentlerin tespiti
- **Route Analizi**: Statik ve dinamik route'ların tespiti ve haritası
- **Tarihsel Analiz**: Versiyon karşılaştırması ve trend analizi
- **Gelişmiş Görselleştirme**: İnteraktif grafikler ve filtreleme özellikleri

## Kurulum

```bash
npm install -g next-js-analyzer
```

veya

```bash
yarn global add next-js-analyzer
```

## Kullanım

### Temel Kullanım

```bash
# Proje dizininde çalıştırın
next-js-analyzer analyze
```

### Belirli Bir Modül İle Analiz

```bash
# Sadece komponent analizi
next-js-analyzer analyze --module component

# Sadece performans analizi
next-js-analyzer analyze --module performance

# Sadece güvenlik analizi
next-js-analyzer analyze --module security

# Sadece SEO analizi
next-js-analyzer analyze --module seo

# Sadece veri fetching analizi
next-js-analyzer analyze --module data-fetching

# Sadece kod kalitesi analizi
next-js-analyzer analyze --module code-quality

# Sadece route analizi
next-js-analyzer analyze --module routing

# Sadece tarihsel analiz
next-js-analyzer analyze --module history

# Gelişmiş görselleştirme
next-js-analyzer analyze --module visualization
```

### Kısayol Komutları

```bash
# Komponent analizi
next-js-analyzer analyze:component

# Performans analizi
next-js-analyzer analyze:performance

# Güvenlik analizi
next-js-analyzer analyze:security

# SEO analizi
next-js-analyzer analyze:seo

# Veri fetching analizi
next-js-analyzer analyze:data-fetching

# Kod kalitesi analizi
next-js-analyzer analyze:code-quality

# Route analizi
next-js-analyzer analyze:routing

# Tarihsel analiz
next-js-analyzer analyze:history

# Görselleştirme
next-js-analyzer visualize
```

### Mevcut Modülleri Listeleme

```bash
next-js-analyzer list-modules
```

## Çıktı Formatları

Next.js Analyzer, analiz sonuçlarını üç farklı formatta sunar:

- **Metin**: Terminal üzerinde okunabilir metin formatında
- **HTML**: İnteraktif grafikler ve filtreleme özellikleri içeren HTML formatında
- **JSON**: Programatik kullanım için JSON formatında

```bash
# HTML formatında çıktı
next-js-analyzer analyze --format html

# JSON formatında çıktı
next-js-analyzer analyze --format json

# Metin formatında çıktı (varsayılan)
next-js-analyzer analyze --format text
```

## Modül Detayları

### Komponent Analizi

Server ve client komponentlerin tespiti ve analizi. Next.js 13+ App Router ve Pages Router desteklenir.

```bash
next-js-analyzer analyze:component
```

### Performans Analizi

Bundle size ve image optimizasyon kontrolü. Büyük komponentleri ve optimize edilmemiş görselleri tespit eder.

```bash
next-js-analyzer analyze:performance
```

### Güvenlik Analizi

Server komponentlerde ve API route'larda güvenlik kontrolü. Olası güvenlik açıklarını tespit eder.

```bash
next-js-analyzer analyze:security
```

### SEO Analizi

Meta tag ve semantik HTML kontrolü. SEO için önemli eksiklikleri tespit eder.

```bash
next-js-analyzer analyze:seo
```

### Veri Fetching Analizi

getServerSideProps, getStaticProps ve client-side veri çekme yöntemlerinin analizi. Cache stratejisi önerileri sunar.

```bash
next-js-analyzer analyze:data-fetching
```

### Kod Kalitesi Analizi

Kullanılmayan komponentlerin tespiti. Kod kalitesini artırmak için öneriler sunar.

```bash
next-js-analyzer analyze:code-quality
```

### Route Analizi

Statik ve dinamik route'ların tespiti ve haritası. Route yapısını görselleştirir.

```bash
next-js-analyzer analyze:routing
```

### Tarihsel Analiz

Versiyon karşılaştırması ve trend analizi. Projenin zaman içindeki değişimini analiz eder.

```bash
next-js-analyzer analyze:history
```

### Gelişmiş Görselleştirme

İnteraktif grafikler ve filtreleme özellikleri. Analiz sonuçlarını görselleştirir.

```bash
next-js-analyzer visualize
```

## Programatik Kullanım

Next.js Analyzer'ı kendi projenizde programatik olarak kullanabilirsiniz:

```javascript
const { NextJsAnalyzer } = require('next-js-analyzer');

async function analyzeProject() {
  const analyzer = new NextJsAnalyzer({
    projectPath: '/path/to/your/nextjs/project',
    modules: ['component', 'performance', 'security']
  });
  
  const results = await analyzer.analyze();
  console.log(results);
}

analyzeProject();
```

## Katkıda Bulunma

Katkıda bulunmak için lütfen GitHub üzerinden bir issue açın veya pull request gönderin.

## Lisans

MIT
