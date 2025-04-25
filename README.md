# Next.js Analyzer

Next.js projelerinde server ve client componentleri analiz eden bir araç.

## Özellikler

- Next.js projelerindeki tüm sayfaları ve bileşenleri tarar
- Her bir dosyanın server component mi client component mi olduğunu belirler
- İmport edilen bileşenleri de takip eder ve onların da türünü belirler
- @ ile başlayan alias importlarını destekler (jsconfig.json veya tsconfig.json'daki paths ayarlarını kullanır)
- Sonuçları tree-view benzeri bir yapıda gösterir
- Konsol çıktısını renkli olarak sunar
- Analiz sonuçlarını text veya JSON formatında kaydeder

## Kurulum

```bash
npm install
```

## Kullanım

```bash
node index.js [options]
```

### Seçenekler

- `-p, --path <path>`: Analiz edilecek Next.js projesinin yolu (varsayılan: mevcut dizin)
- `-o, --output <output>`: Analiz sonuçlarının kaydedileceği dosya yolu (varsayılan: nextjs-analysis.txt)
- `-f, --format <format>`: Çıktı formatı (text, json veya html) (varsayılan: text)
- `-v, --verbose`: Detaylı çıktı göster

### Örnekler

```bash
# Mevcut dizindeki Next.js projesini analiz et
node index.js

# Belirli bir dizindeki Next.js projesini analiz et
node index.js -p /path/to/nextjs/project

# Analiz sonuçlarını JSON formatında kaydet
node index.js -f json -o analysis.json

# Analiz sonuçlarını HTML formatında kaydet
node index.js -f html -o analysis.html

# Detaylı çıktı göster
node index.js -v
```

## Next.js 14+ Server ve Client Component Kuralları

Next.js 14 ve sonraki sürümlerde, bütün komponentler varsayılan olarak Server Component'tir. Yani bir sayfa server-side olarak tanımlandığında, içindeki tüm komponentler de otomatik olarak server component olarak değerlendirilir.

Ancak bir komponentin içinde 'use client' direktifi kullanıldığında, o komponent ve içinde import edilen tüm komponentler Client Component olarak işlenir:

- 'use client' direktifi kullanılan bir dosyadaki tüm kod client-side'da çalışır
- Bu dosyadan import edilen diğer komponentler de otomatik olarak client component olur
- 'use client' direktifi olan bir komponent, server componentleri import edip kullanabilir (bunlar server-side'da render edilir ve sonuçları client'a gönderilir)

## Çıktı Örnekleri

### Text Çıktısı

```
📁 app/
├── 📄 app/page.js (Server Component)
│   ├── 📄 components/layout/HomePage.js (Server Component)
│   │   ├── 📄 components/ui/Hero.js (Client Component)
│   │   │   └── 📄 components/ui/HeroSlide.js (Client Component)
│   │   └── 📄 components/ui/Features.js (Server Component)
│   └── 📄 components/shared/ThemeController.js (Client Component)
├── 📄 app/about/page.js (Server Component)
│   └── 📄 components/layout/AboutPage.js (Server Component)
└── 📄 app/contact/page.js (Server Component)
    └── 📄 components/layout/ContactPage.js (Server Component)
```

### HTML Çıktısı

HTML çıktısı, interaktif bir arayüz sunar ve her bir bileşenin üzerine tıklayarak detaylarını görebilirsiniz:

- Bileşen türü (Client/Server)
- Import edilen bileşenler
- Bileşeni import eden diğer bileşenler

### JSON Çıktısı

```json
{
  "appComponents": [
    {
      "path": "app/page.js",
      "type": "server",
      "initialType": "server",
      "imports": [
        "components/layout/HomePage.js",
        "components/shared/ThemeController.js"
      ],
      "importedBy": []
    },
    {
      "path": "app/about/page.js",
      "type": "server",
      "initialType": "server",
      "imports": [
        "components/layout/AboutPage.js"
      ],
      "importedBy": []
    }
  ],
  "otherComponents": [
    {
      "path": "components/ui/Hero.js",
      "type": "client",
      "initialType": "client",
      "imports": [
        "components/ui/HeroSlide.js"
      ],
      "importedBy": [
        "components/layout/HomePage.js"
      ]
    }
  ]
}
```

## Lisans

MIT
