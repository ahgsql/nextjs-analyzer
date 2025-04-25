/**
 * Türkçe dil dosyası
 */
module.exports = {
  common: {
    error: "Hata",
    success: "Başarılı",
    warning: "Uyarı",
    info: "Bilgi"
  },
  cli: {
    name: "nextjs-analyzer",
    description: "Next.js projelerini analiz eden modüler araç",
    commands: {
      analyze: {
        description: "Tüm analiz modüllerini çalıştır",
        options: {
          path: "Analiz edilecek Next.js projesinin yolu",
          output: "Analiz sonuçlarının kaydedileceği dosya yolu",
          format: "Çıktı formatı (text, json veya html)",
          verbose: "Detaylı çıktı göster"
        },
        messages: {
          moduleSelection: "Hangi modülü çalıştırmak istiyorsunuz?",
          formatSelection: "Hangi formatta çıktı almak istiyorsunuz?",
          allModules: "Tüm modüller: Tüm analiz modüllerini çalıştır",
          runningModules: "Modüller çalıştırılıyor...",
          visualizing: "Sonuçlar görselleştiriliyor...",
          completed: "Analiz tamamlandı."
        }
      },
      listModules: {
        description: "Kullanılabilir analiz modüllerini listeler",
        messages: {
          availableModules: "Kullanılabilir Analiz Modülleri:"
        }
      },
      settings: {
        description: "Uygulama ayarlarını yapılandır",
        messages: {
          languageSelection: "Hangi dili kullanmak istiyorsunuz?",
          languageChanged: "Dil değiştirildi: {language}",
          settingsSaved: "Ayarlar kaydedildi."
        }
      }
    },
    formats: {
      text: "Metin (text)",
      html: "HTML",
      json: "JSON"
    }
  },
  analyzer: {
    messages: {
      analyzing: "Next.js projesi analiz ediliyor...",
      noNextJsDirs: "Hata: Next.js app veya pages dizini bulunamadı.",
      noJsFiles: "Hata: Hiç JavaScript/TypeScript dosyası bulunamadı.",
      filesFound: "{count} dosya bulundu.",
      analysisFailed: "Analiz tamamlanamadı.",
      unexpectedError: "Beklenmeyen bir hata oluştu:"
    }
  },
  modules: {
    component: {
      name: "component",
      description: "Next.js projelerinde server ve client componentleri analiz eder",
      types: {
        server: "Server Component",
        client: "Client Component"
      }
    },
    performance: {
      name: "performance",
      description: "Performans metrikleri ve optimizasyon önerileri sunar",
      imageOptimization: {
        title: "Image Optimizasyon",
        fullyOptimized: "Tüm görüntüler optimize edilmiş. Harika!",
        notFullyOptimized: "Toplam {totalImages} görüntüden {nonOptimizedCount} tanesi optimize edilmemiş.",
        nonOptimizedImages: "Optimize Edilmemiş Görüntüler",
        issues: {
          noNextImage: "Next.js Image komponenti kullanılmıyor",
          noWidthHeight: "Image komponentinde width ve/veya height belirtilmemiş",
          noPriority: "Hero/banner görüntüsü için priority attribute'u kullanılmamış"
        },
        recommendations: {
          useNextImage: "next/image import edip, <Image> komponenti kullanın",
          addWidthHeight: "CLS (Cumulative Layout Shift) sorunlarını önlemek için width ve height belirtin",
          addPriority: "LCP (Largest Contentful Paint) metriğini iyileştirmek için hero görüntülerine priority ekleyin"
        }
      },
      bundleSize: {
        title: "Bundle Size Analizi",
        largeComponents: {
          title: "Büyük Komponentler",
          noLargeComponents: "Büyük komponent tespit edilmedi. Harika!",
          recommendation: "Komponenti daha küçük parçalara bölmeyi düşünün"
        },
        largeImports: {
          title: "Büyük Kütüphaneler",
          noLargeImports: "Büyük kütüphane import'u tespit edilmedi. Harika!",
          recommendations: {
            lodash: "Sadece ihtiyaç duyulan fonksiyonları import edin: import { debounce } from \"lodash/debounce\"",
            moment: "date-fns veya day.js gibi daha hafif alternatifleri kullanın",
            chartjs: "Sadece ihtiyaç duyulan chart türlerini import edin",
            threejs: "Dynamic import ile lazy loading yapın",
            monaco: "Dynamic import ile lazy loading yapın",
            draftjs: "Dynamic import ile lazy loading yapın",
            quill: "Dynamic import ile lazy loading yapın",
            reactBootstrap: "Sadece ihtiyaç duyulan komponentleri import edin",
            materialUi: "@mui/material'in tree-shakeable versiyonunu kullanın",
            materialCore: "Sadece ihtiyaç duyulan komponentleri import edin",
            mui: "Sadece ihtiyaç duyulan komponentleri import edin",
            default: "Dynamic import ile lazy loading yapın"
          }
        }
      },
      visualize: {
        title: "Performans Analizi",
        file: "Dosya",
        issue: "Sorun",
        recommendation: "Öneri",
        size: "Boyut",
        library: "Kütüphane",
        source: "Kaynak"
      }
    },
    security: {
      name: "security",
      description: "Güvenlik açıklarını ve riskleri tespit eder",
      serverComponent: {
        title: "Server Component Güvenliği",
        noIssues: "Server component'lerde güvenlik sorunu tespit edilmedi. Harika!",
        issues: {
          sensitiveEnvVars: "Hassas çevresel değişkenler doğrudan server component'te kullanılıyor",
          sqlInjection: "Olası SQL injection riski",
          fileSystemAccess: "Kullanıcı girdisi ile dosya sistemi erişimi",
          evalUsage: "eval() veya new Function() kullanımı"
        },
        recommendations: {
          title: "Server Component Güvenliği",
          description: "Server component'ler, hassas bilgileri içerebilir. Bu bilgilerin client'a sızdırılmamasına dikkat edin.",
          envVars: {
            title: "Çevresel Değişkenler",
            description: "Server component'lerde kullanılan çevresel değişkenler, client bundle'a dahil edilmez. Ancak, bu değişkenleri doğrudan JSX içinde kullanmak, bu bilgilerin client'a sızmasına neden olabilir."
          },
          dataValidation: {
            title: "Veri Doğrulama",
            description: "Server component'lerde kullanıcı girdilerini her zaman doğrulayın ve temizleyin."
          },
          sensitiveEnvVars: "Hassas bilgileri içeren çevresel değişkenleri doğrudan client'a göndermekten kaçının. Bunun yerine, API route'lar kullanarak bu bilgileri güvenli bir şekilde işleyin.",
          sqlInjection: "SQL sorgularında kullanıcı girdilerini doğrudan kullanmak yerine, parametreli sorgular veya ORM kullanın.",
          fileSystemAccess: "Kullanıcı girdilerini dosya yollarında kullanmak tehlikelidir. Girdileri doğrulayın ve güvenli hale getirin.",
          evalUsage: "eval() ve new Function() kullanımından kaçının, çünkü bunlar kod enjeksiyonu saldırılarına açıktır."
        }
      },
      apiRoute: {
        title: "API Route Güvenliği",
        noIssues: "API route'larda güvenlik sorunu tespit edilmedi. Harika!",
        issues: {
          corsConfig: "CORS yapılandırması eksik",
          corsWildcard: "CORS yapılandırması çok geniş (wildcard *)",
          rateLimiting: "Rate limiting eksik",
          authentication: "Veri değiştiren API endpoint'inde authentication kontrolü eksik",
          inputValidation: "Input validation eksik",
          httpMethod: "HTTP method kontrolü eksik"
        },
        recommendations: {
          title: "API Route Güvenliği",
          description: "API route'lar, uygulamanızın dış dünyaya açılan kapılarıdır. Bu nedenle, güvenlik önlemlerini dikkatli bir şekilde uygulamalısınız.",
          cors: {
            title: "CORS Yapılandırması",
            description: "CORS yapılandırması, API'nize hangi domain'lerden erişilebileceğini kontrol eder. Wildcard (*) kullanmak yerine, belirli domain'lere izin verin."
          },
          rateLimiting: {
            title: "Rate Limiting",
            description: "Rate limiting, API'nize yapılan istekleri sınırlar ve DDoS saldırılarına karşı koruma sağlar."
          },
          auth: {
            title: "Authentication ve Authorization",
            description: "Veri değiştiren API endpoint'lerinde her zaman authentication ve authorization kontrolü yapın."
          },
          inputValidation: {
            title: "Input Validation",
            description: "Kullanıcı girdilerini her zaman doğrulayın ve temizleyin. Bu, injection saldırılarına karşı koruma sağlar."
          },
          corsConfig: "API route'larda CORS yapılandırması ekleyin. next-cors veya manuel olarak Access-Control-Allow-Origin header'ı ekleyin.",
          corsWildcard: "Wildcard (*) yerine, belirli domain'lere izin verin.",
          rateLimiting: "API route'larda rate limiting ekleyin. express-rate-limit veya benzer bir kütüphane kullanabilirsiniz.",
          authentication: "Veri değiştiren API endpoint'lerinde authentication kontrolü ekleyin.",
          inputValidation: "API route'larda input validation ekleyin. Joi, Yup, Zod gibi kütüphaneler kullanabilirsiniz.",
          httpMethod: "API route'larda HTTP method kontrolü ekleyin. Örneğin: if (req.method !== \"POST\") { return res.status(405).end(); }"
        }
      },
      general: {
        title: "Genel Güvenlik",
        noIssues: "Genel güvenlik sorunu tespit edilmedi. Harika!",
        issues: {
          oldNextVersion: "Eski Next.js sürümü kullanılıyor ({version})",
          insecurePackage: "Güvenlik açığı olan paket: {package}@{version}",
          envNotIgnored: "{file} dosyası .gitignore'da değil",
          sensitiveEnvVar: "Hassas bilgi içeren çevresel değişken: {key}",
          cspMissing: "Content Security Policy (CSP) eksik",
          unsafeConfig: "Güvensiz yapılandırma: dangerouslyAllowSVG veya dangerouslyAllowHTML"
        },
        recommendations: {
          title: "Genel Güvenlik",
          dependencies: {
            title: "Bağımlılık Güvenliği",
            description: "Bağımlılıklarınızı düzenli olarak güncelleyin ve güvenlik açıklarını kontrol edin. npm audit veya yarn audit komutlarını kullanabilirsiniz."
          },
          envSecurity: {
            title: "Çevresel Değişken Güvenliği",
            description: ".env dosyalarını her zaman .gitignore'a ekleyin ve hassas bilgileri güvenli bir şekilde yönetin."
          },
          csp: {
            title: "Content Security Policy",
            description: "Content Security Policy (CSP), XSS saldırılarına karşı güçlü bir koruma sağlar. next.config.js dosyasında CSP başlıklarını yapılandırın."
          },
          safeConfig: {
            title: "Güvenli Yapılandırma",
            description: "dangerouslyAllowSVG, dangerouslyAllowHTML gibi güvensiz yapılandırmalardan kaçının."
          },
          securityAudits: {
            title: "Düzenli Güvenlik Denetimleri",
            description: "Uygulamanızı düzenli olarak güvenlik açıklarına karşı denetleyin ve güncel tutun."
          },
          oldNextVersion: "Güvenlik güncellemeleri için Next.js'i en son sürüme yükseltin.",
          insecurePackage: "{package} paketini en az {minVersion} sürümüne yükseltin.",
          envNotIgnored: "{file} dosyasını .gitignore'a ekleyin. Hassas bilgiler repository'de saklanmamalıdır.",
          sensitiveEnvVar: "{file} dosyasını .gitignore'a ekleyin ve hassas bilgileri güvenli bir şekilde yönetin.",
          cspMissing: "next.config.js dosyasında Content Security Policy ekleyin. Bu, XSS saldırılarına karşı koruma sağlar.",
          unsafeConfig: "Bu yapılandırmalar XSS saldırılarına açık olabilir. Mümkünse kullanmaktan kaçının."
        }
      },
      visualize: {
        title: "Güvenlik Analizi",
        summary: "Özet",
        totalIssues: "Toplam {count} güvenlik sorunu tespit edildi:",
        criticalIssues: "Kritik",
        highIssues: "Yüksek",
        mediumIssues: "Orta",
        lowIssues: "Düşük",
        detectedIssues: "Tespit Edilen Sorunlar",
        recommendations: "Öneriler",
        file: "Dosya",
        issue: "Sorun",
        severity: "Önem Derecesi",
        recommendation: "Öneri"
      }
    },
    seo: {
      name: "seo",
      description: "SEO uyumluluğunu ve meta etiketleri analiz eder",
      metaTags: {
        title: "Meta Tag Sorunları",
        noIssues: "Meta tag sorunu tespit edilmedi. Harika!",
        issues: {
          titleMissing: "Title tag eksik",
          descriptionMissing: "Meta description eksik",
          ogMissing: "Open Graph meta tag'leri eksik",
          twitterMissing: "Twitter Card meta tag'leri eksik",
          canonicalMissing: "Canonical URL eksik",
          robotsBlocking: "Robots meta tag'i sayfanın indekslenmesini engelliyor",
          viewportMissing: "Viewport meta tag eksik",
          langMissing: "HTML lang attribute eksik"
        },
        recommendations: {
          title: "Meta Tag Önerileri",
          titleTag: "Sayfaya title tag ekleyin. Bu, SEO için çok önemlidir.",
          descriptionTag: "Sayfaya meta description ekleyin. Bu, arama sonuçlarında görüntülenen açıklamadır.",
          ogTags: "Sosyal medya paylaşımları için Open Graph meta tag'leri ekleyin.",
          twitterTags: "Twitter paylaşımları için Twitter Card meta tag'leri ekleyin.",
          canonicalUrl: "Duplicate content sorunlarını önlemek için canonical URL ekleyin.",
          robotsTags: "Eğer bu sayfa indekslenmeli ise, noindex ve nofollow değerlerini kaldırın.",
          viewportTag: "Mobil uyumluluk için viewport meta tag ekleyin.",
          langAttribute: "Erişilebilirlik ve SEO için HTML lang attribute ekleyin.",
          nextSeo: {
            title: "next-seo Kullanımı",
            description: "next-seo paketi, Next.js projelerinde SEO yönetimini kolaylaştırır. Bu paketi kullanarak, tüm meta tag'leri merkezi bir şekilde yönetebilirsiniz."
          },
          dynamicMetaTags: {
            title: "Dinamik Meta Tag'ler",
            description: "Dinamik içerikli sayfalar için, sayfa içeriğine göre dinamik meta tag'ler oluşturun. Bu, arama motorlarının sayfanızı daha iyi anlamasını sağlar."
          },
          structuredData: {
            title: "Structured Data",
            description: "JSON-LD formatında structured data ekleyin. Bu, arama sonuçlarında zengin snippet'ler görüntülenmesini sağlar."
          },
          hreflang: {
            title: "Hreflang Tag'leri",
            description: "Çok dilli siteler için hreflang tag'leri ekleyin. Bu, arama motorlarının doğru dildeki sayfayı göstermesini sağlar."
          }
        }
      },
      semanticHtml: {
        title: "Semantik HTML Sorunları",
        noIssues: "Semantik HTML sorunu tespit edilmedi. Harika!",
        issues: {
          multipleH1: "Birden fazla H1 tag'i kullanılmış",
          h2BeforeH1: "H2 tag'i H1'den önce kullanılmış",
          h3BeforeH2: "H3 tag'i H2'den önce kullanılmış",
          noSemanticTags: "Semantik HTML tag'leri kullanılmamış",
          imgWithoutAlt: "Image tag'lerinde alt attribute eksik",
          genericLinkText: "Jenerik link text'leri kullanılmış"
        },
        recommendations: {
          title: "Semantik HTML Önerileri",
          headingHierarchy: "Heading hiyerarşisini düzgün kullanın. H1 tag'i sayfanın en üstünde olmalıdır.",
          h3AfterH2: "Heading hiyerarşisini düzgün kullanın. H3 tag'leri H2'lerden sonra gelmelidir.",
          useSemanticTags: "div ve span yerine semantik HTML5 tag'lerini (header, nav, main, article, section, aside, footer) kullanın.",
          addAltAttributes: "Tüm image tag'lerine alt attribute ekleyin. Bu, erişilebilirlik ve SEO için önemlidir.",
          descriptiveLinkText: "\"here\", \"click\", \"link\", \"read more\" gibi jenerik link text'leri yerine, daha açıklayıcı link text'leri kullanın.",
          semanticHtml: {
            title: "Semantik HTML Kullanımı",
            description: "Semantik HTML tag'leri, sayfanızın yapısını daha iyi tanımlar ve arama motorlarının içeriğinizi daha iyi anlamasını sağlar."
          },
          headings: {
            title: "Heading Hiyerarşisi",
            description: "Düzgün bir heading hiyerarşisi kullanın. Her sayfada bir H1 tag'i olmalı ve diğer heading'ler hiyerarşik olarak sıralanmalıdır."
          },
          altAttributes: {
            title: "Alt Attribute",
            description: "Tüm image tag'lerine alt attribute ekleyin. Bu, görsel içeriğin metin alternatifini sağlar ve erişilebilirlik için önemlidir."
          },
          linkTexts: {
            title: "Açıklayıcı Link Text'leri",
            description: "Link text'leri, link'in nereye gittiğini açıkça belirtmelidir. \"here\", \"click\" gibi jenerik text'ler yerine, daha açıklayıcı text'ler kullanın."
          }
        }
      },
      accessibility: {
        title: "Erişilebilirlik Sorunları",
        noIssues: "Erişilebilirlik sorunu tespit edilmedi. Harika!",
        issues: {
          ariaAttributesMissing: "ARIA attribute'leri eksik",
          formLabelsMissing: "Form input'ları için label eksik",
          lowContrast: "Düşük kontrast oranı",
          keyboardNavigationMissing: "Klavye navigasyonu eksik",
          negativeTabIndex: "tabIndex=\"-1\" kullanımı"
        },
        recommendations: {
          title: "Erişilebilirlik Önerileri",
          addAriaAttributes: "Erişilebilirlik için ARIA attribute'leri ve role'ler ekleyin.",
          addFormLabels: "Tüm form input'ları için label ekleyin ve for attribute ile input'a bağlayın.",
          improveContrast: "Metin ve arka plan arasında yeterli kontrast oranı sağlayın. WCAG 2.1 AA standardına göre, normal metin için en az 4.5:1, büyük metin için en az 3:1 kontrast oranı olmalıdır.",
          addKeyboardNavigation: "onClick event'leri için klavye event'leri de ekleyin. Bu, klavye kullanıcıları için erişilebilirliği artırır.",
          avoidNegativeTabIndex: "tabIndex=\"-1\" kullanımı, elementi klavye navigasyonundan çıkarır. Bu, erişilebilirlik sorunlarına neden olabilir.",
          ariaAttributes: {
            title: "ARIA Attribute'leri",
            description: "ARIA attribute'leri, web sayfanızın erişilebilirliğini artırır. Bu attribute'ler, ekran okuyucuların içeriğinizi daha iyi anlamasını sağlar."
          },
          formLabels: {
            title: "Form Label'ları",
            description: "Tüm form input'ları için label ekleyin. Bu, kullanıcıların input'ların ne için olduğunu anlamasını sağlar."
          },
          contrast: {
            title: "Kontrast Oranı",
            description: "Metin ve arka plan arasında yeterli kontrast oranı sağlayın. Bu, görme zorluğu olan kullanıcılar için önemlidir."
          },
          keyboardNavigation: {
            title: "Klavye Navigasyonu",
            description: "Tüm interaktif elementlerin klavye ile erişilebilir olduğundan emin olun. Bu, fare kullanamayan kullanıcılar için önemlidir."
          },
          accessibilityTests: {
            title: "Erişilebilirlik Testleri",
            description: "Uygulamanızı düzenli olarak erişilebilirlik testlerine tabi tutun. axe, Lighthouse gibi araçlar kullanabilirsiniz."
          }
        }
      },
      visualize: {
        title: "SEO Analizi",
        summary: "Özet",
        totalIssues: "Toplam {totalIssues} SEO sorunu tespit edildi:",
        metaTagIssues: "Meta Tag Sorunları",
        semanticHtmlIssues: "Semantik HTML Sorunları",
        accessibilityIssues: "Erişilebilirlik Sorunları",
        detectedIssues: "Tespit Edilen Sorunlar",
        file: "Dosya",
        issue: "Sorun",
        recommendation: "Öneri",
        recommendations: "Öneriler"
      }
    },
    "data-fetching": {
      name: "data-fetching",
      description: "Veri çekme yöntemlerini ve stratejilerini analiz eder",
      recommendations: {
        serverSideProps: {
          withRevalidate: "getServerSideProps ile revalidate kullanmak yerine, getStaticProps kullanmayı düşünün",
          withRequestData: "Request bilgilerine ihtiyaç duyduğunuz için getServerSideProps doğru bir seçim",
          default: "Eğer veri sık değişmiyorsa, getStaticProps + revalidate (ISR) kullanmayı düşünün"
        },
        staticProps: {
          noRevalidate: "Veri değişebiliyorsa, revalidate ekleyerek ISR (Incremental Static Regeneration) kullanın",
          lowRevalidate: "Revalidate değeri çok düşük. Gereksiz yeniden oluşturmaları önlemek için daha yüksek bir değer kullanmayı düşünün",
          default: "getStaticProps + revalidate (ISR) iyi bir seçim"
        },
        staticPaths: {
          fallbackFalse: "fallback: false, bilinmeyen path'ler için 404 döndürür. Eğer yeni içerikler ekleniyorsa, fallback: \"blocking\" veya fallback: true kullanmayı düşünün",
          fallbackBlocking: "fallback: \"blocking\", iyi bir seçim. Bilinmeyen path'ler için SSR gibi davranır",
          fallbackTrue: "fallback: true ile, loading state göstermeyi unutmayın",
          default: "getStaticPaths için fallback değeri belirtin"
        },
        swr: {
          noRevalidateOnFocus: "revalidateOnFocus, revalidateOnReconnect gibi seçenekleri belirtin",
          noDedupingInterval: "Gereksiz istekleri önlemek için dedupingInterval ekleyin",
          default: "SWR iyi bir client-side veri fetching seçimi"
        },
        reactQuery: {
          noStaleTime: "staleTime ve cacheTime değerlerini belirtin",
          zeroStaleTime: "staleTime: 0, her render'da yeni veri çeker. Gereksiz istekleri önlemek için daha yüksek bir değer kullanmayı düşünün",
          default: "React Query iyi bir client-side veri fetching seçimi"
        },
        fetch: {
          noCache: "fetch isteğine cache stratejisi ekleyin: { cache: \"force-cache\" } veya { cache: \"no-store\" }",
          forceCache: "force-cache, statik veriler için iyi bir seçim",
          noStore: "no-store, dinamik veriler için iyi bir seçim",
          default: "fetch API için uygun cache stratejisi seçin"
        },
        axios: {
          default: "Axios için cache mekanizması eklemek için axios-cache-adapter kullanmayı düşünün"
        }
      },
      issues: {
        bothDataFetchingMethods: {
          issue: "getServerSideProps ve getStaticProps aynı dosyada kullanılıyor",
          recommendation: "Bu iki fonksiyonu aynı dosyada kullanmak yerine, ayrı dosyalara ayırın"
        },
        staticPropsNoRevalidate: {
          issue: "getStaticProps kullanılıyor ama revalidate belirtilmemiş",
          recommendation: "ISR (Incremental Static Regeneration) için revalidate ekleyin"
        },
        fetchNoCache: {
          issue: "fetch API kullanılıyor ama cache stratejisi belirtilmemiş",
          recommendation: "fetch isteğine cache stratejisi ekleyin: { cache: \"force-cache\" } veya { cache: \"no-store\" }"
        }
      },
      generalRecommendations: {
        appRouter: {
          title: "App Router için Veri Fetching",
          description: "App Router kullanıyorsanız, React Server Components ile veri fetching yapabilirsiniz. Bu, client-side JavaScript'i azaltır ve SEO'yu iyileştirir."
        },
        clientSide: {
          title: "SWR veya React Query Kullanımı",
          description: "Client-side veri fetching için SWR veya React Query kullanın. Bu kütüphaneler, caching, revalidation, error handling gibi özellikleri otomatik olarak sağlar."
        },
        isr: {
          title: "Incremental Static Regeneration (ISR)",
          description: "Sık değişmeyen veriler için getStaticProps ile ISR kullanın. Bu, statik sayfaların belirli aralıklarla yeniden oluşturulmasını sağlar."
        }
      },
      visualize: {
        title: "Veri Fetching Analizi",
        methods: {
          title: "Veri Fetching Yöntemleri",
          serverSideProps: "getServerSideProps",
          staticProps: "getStaticProps",
          staticPaths: "getStaticPaths",
          revalidate: "Revalidate",
          fallback: "Fallback",
          notSpecified: "Belirtilmemiş",
          recommendation: "Öneri"
        },
        clientSide: {
          title: "Client-side Veri Fetching",
          swr: "SWR",
          reactQuery: "React Query",
          fetch: "Fetch API",
          axios: "Axios",
          revalidateOnFocus: "revalidateOnFocus",
          staleTime: "staleTime",
          cache: "Cache"
        },
        cacheStrategies: {
          title: "Cache Stratejileri",
          issues: {
            title: "Tespit Edilen Sorunlar",
            noIssues: "Herhangi bir sorun tespit edilmedi. Harika!",
            issue: "Sorun"
          },
          recommendations: {
            title: "Genel Öneriler"
          }
        }
      }
    },
    "code-quality": {
      name: "code-quality",
      description: "Kod kalitesi ve best practice kontrolü yapar",
      types: {
        "unused-component": "Kullanılmayan Komponent"
      },
      visualize: {
        title: "Kullanılmayan Komponentler",
        noUnusedComponents: "Kullanılmayan komponent bulunamadı."
      }
    },
    routing: {
      name: "routing",
      description: "Route yapısını analiz eder ve görselleştirir",
      visualize: {
        title: "Route Analizi",
        noRoutes: "Hiç route bulunamadı.",
        appRouter: "App Router",
        pagesRouter: "Pages Router",
        pages: "Sayfalar",
        apiRoutes: "API Route'lar",
        staticPages: "Statik Sayfalar",
        dynamicPages: "Dinamik Sayfalar",
        staticApiRoutes: "Statik API Route'lar",
        dynamicApiRoutes: "Dinamik API Route'lar",
        parameters: "Parametreler"
      }
    },
    history: {
      name: "history",
      description: "Proje geçmişini ve değişiklikleri analiz eder",
      error: {
        noGit: "Git deposu bulunamadı. Tarihsel analiz için Git gereklidir."
      },
      summary: {
        title: "Özet",
        totalCommits: "Toplam {totalCommits} commit incelendi, {analyzedCommits} commit analiz edildi.",
        firstCommitDate: "İlk commit tarihi: {date}",
        lastCommitDate: "Son commit tarihi: {date}"
      },
      commitHistory: {
        title: "Commit Geçmişi",
        moreCommits: "... ve {count} commit daha"
      },
      metricChanges: {
        title: "Metrik Değişimleri",
        metrics: {
          componentCount: "Toplam Komponent Sayısı",
          serverComponentCount: "Server Komponent Sayısı",
          clientComponentCount: "Client Komponent Sayısı",
          routeCount: "Toplam Route Sayısı",
          apiRouteCount: "API Route Sayısı",
          pageRouteCount: "Sayfa Route Sayısı",
          dynamicRouteCount: "Dinamik Route Sayısı",
          staticRouteCount: "Statik Route Sayısı"
        },
        trend: "Trend",
        firstValue: "İlk değer",
        lastValue: "Son değer",
        totalGrowth: "Toplam büyüme",
        growthRate: "Büyüme hızı",
        perCommit: "/ commit",
        changeDetails: "Değişim Detayları"
      },
      trends: {
        rapidGrowth: "Hızlı Büyüme",
        steadyGrowth: "Düzenli Büyüme",
        stable: "Stabil",
        steadyDecline: "Düzenli Azalma",
        rapidDecline: "Hızlı Azalma",
        unknown: "Bilinmiyor"
      },
      visualize: {
        title: "Zaman İçinde Değişim Analizi",
        chartTitle: "{metricName} Değişimi"
      }
    },
    visualization: {
      name: "visualization",
      description: "Analiz sonuçlarını interaktif grafiklerle görselleştirir",
      summary: {
        title: "Özet",
        totalModules: "Toplam {totalModules} modül",
        totalIssues: "Toplam {totalIssues} sorun tespit edildi"
      },
      charts: {
        moduleIssues: {
          title: "Modül Başına Sorun Sayıları",
          issueCount: "Sorun Sayısı"
        },
        issueTypes: {
          title: "Sorun Türü Dağılımı"
        },
        severityDistribution: {
          title: "Önem Derecesi Dağılımı"
        }
      },
      filtering: {
        title: "Filtreleme",
        module: "Modül:",
        issueType: "Sorun Türü:",
        severity: "Önem Derecesi:",
        file: "Dosya:",
        all: "Tümü",
        applyFilter: "Filtrele",
        instructions: "Filtreleme yapmak için yukarıdaki seçenekleri kullanın.",
        results: {
          title: "Filtreleme Sonuçları",
          loading: "Filtreleme sonuçları yükleniyor...",
          module: "Modül:",
          issueType: "Sorun Türü:",
          severity: "Önem Derecesi:",
          file: "Dosya:",
          message: "Bu filtreleme kriterlerine göre sonuçlar burada gösterilecektir."
        }
      },
      issueTypes: {
        serverComponent: "Server Component",
        clientComponent: "Client Component",
        unusedComponent: "Kullanılmayan Komponent",
        dynamicRoute: "Dinamik Route",
        nonOptimizedImage: "Optimize Edilmemiş Görüntü",
        largeComponent: "Büyük Komponent",
        largeImport: "Büyük Kütüphane Import'u",
        cacheStrategyIssue: "Cache Stratejisi Sorunu",
        serverSecurityIssue: "Server Güvenlik Sorunu",
        apiSecurityIssue: "API Güvenlik Sorunu",
        generalSecurityIssue: "Genel Güvenlik Sorunu",
        metaTagIssue: "Meta Tag Sorunu",
        semanticHtmlIssue: "Semantik HTML Sorunu",
        accessibilityIssue: "Erişilebilirlik Sorunu"
      },
      visualize: {
        title: "Gelişmiş Görselleştirme",
        summary: "Özet",
        moduleIssues: "Modül Başına Sorun Sayıları",
        issueTypeDistribution: "Sorun Türü Dağılımı",
        severityDistribution: "Önem Derecesi Dağılımı",
        filterOptions: "Filtreleme Seçenekleri",
        modules: "Modüller",
        issueTypes: "Sorun Türleri",
        severities: "Önem Dereceleri",
        files: "Dosyalar",
        andMore: "... ve {count} dosya daha"
      }
    }
  }
};
