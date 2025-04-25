const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath } = require('../../utils');

/**
 * Veri Fetching Analizi Modülü
 */
module.exports = {
  name: 'data-fetching',
  description: 'Next.js projelerinde veri fetching yöntemlerini analiz eder',
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Veri fetching yöntemlerini analiz et
    const fetchingMethods = await this.analyzeFetchingMethods(analyzer);
    
    // Cache stratejilerini analiz et
    const cacheStrategies = await this.analyzeCacheStrategies(analyzer);
    
    return {
      results: {
        fetchingMethods,
        cacheStrategies
      },
      metadata: {
        totalFilesAnalyzed: fetchingMethods.totalFiles,
        getServerSidePropsCount: fetchingMethods.getServerSideProps.length,
        getStaticPropsCount: fetchingMethods.getStaticProps.length,
        getStaticPathsCount: fetchingMethods.getStaticPaths.length,
        swrCount: fetchingMethods.swr.length,
        reactQueryCount: fetchingMethods.reactQuery.length,
        fetchCount: fetchingMethods.fetch.length,
        axiosCount: fetchingMethods.axios.length
      }
    };
  },
  
  /**
   * Veri fetching yöntemlerini analiz eder
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Veri fetching yöntemleri
   */
  async analyzeFetchingMethods(analyzer) {
    const getServerSideProps = [];
    const getStaticProps = [];
    const getStaticPaths = [];
    const swr = [];
    const reactQuery = [];
    const fetch = [];
    const axios = [];
    let totalFiles = 0;
    
    // Tüm komponentleri tara
    for (const [filePath, component] of analyzer.components.entries()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        totalFiles++;
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // getServerSideProps kontrolü
        if (content.includes('export async function getServerSideProps') || 
            content.includes('export const getServerSideProps') ||
            content.includes('export default async function getServerSideProps')) {
          
          const revalidateMatch = content.match(/revalidate\s*:\s*(\d+)/);
          const revalidate = revalidateMatch ? parseInt(revalidateMatch[1]) : null;
          
          getServerSideProps.push({
            file: relativePath,
            revalidate,
            recommendation: this.getServerSidePropsRecommendation(content, revalidate)
          });
        }
        
        // getStaticProps kontrolü
        if (content.includes('export async function getStaticProps') || 
            content.includes('export const getStaticProps') ||
            content.includes('export default async function getStaticProps')) {
          
          const revalidateMatch = content.match(/revalidate\s*:\s*(\d+)/);
          const revalidate = revalidateMatch ? parseInt(revalidateMatch[1]) : null;
          
          getStaticProps.push({
            file: relativePath,
            revalidate,
            recommendation: this.getStaticPropsRecommendation(content, revalidate)
          });
        }
        
        // getStaticPaths kontrolü
        if (content.includes('export async function getStaticPaths') || 
            content.includes('export const getStaticPaths') ||
            content.includes('export default async function getStaticPaths')) {
          
          const fallbackMatch = content.match(/fallback\s*:\s*['"]?([^'",\s}]*)['"]?/);
          const fallback = fallbackMatch ? fallbackMatch[1] : null;
          
          getStaticPaths.push({
            file: relativePath,
            fallback,
            recommendation: this.getStaticPathsRecommendation(content, fallback)
          });
        }
        
        // SWR kontrolü
        if (content.includes('useSWR') || content.includes('import { SWR }') || content.includes('import SWR')) {
          const revalidateMatch = content.match(/revalidateOnFocus\s*:\s*(true|false)/);
          const revalidateOnFocus = revalidateMatch ? revalidateMatch[1] === 'true' : null;
          
          swr.push({
            file: relativePath,
            revalidateOnFocus,
            recommendation: this.getSWRRecommendation(content)
          });
        }
        
        // React Query kontrolü
        if (content.includes('useQuery') || content.includes('import { useQuery }') || 
            content.includes('@tanstack/react-query') || content.includes('react-query')) {
          
          const staleTimeMatch = content.match(/staleTime\s*:\s*(\d+)/);
          const staleTime = staleTimeMatch ? parseInt(staleTimeMatch[1]) : null;
          
          reactQuery.push({
            file: relativePath,
            staleTime,
            recommendation: this.getReactQueryRecommendation(content, staleTime)
          });
        }
        
        // Fetch API kontrolü
        if (content.includes('fetch(') || content.includes('await fetch')) {
          const cacheMatch = content.match(/cache\s*:\s*['"]([^'"]+)['"]/);
          const cache = cacheMatch ? cacheMatch[1] : null;
          
          fetch.push({
            file: relativePath,
            cache,
            recommendation: this.getFetchRecommendation(content, cache)
          });
        }
        
        // Axios kontrolü
        if (content.includes('axios.') || content.includes('import axios')) {
          axios.push({
            file: relativePath,
            recommendation: 'Axios için cache mekanizması eklemek için axios-cache-adapter kullanmayı düşünün'
          });
        }
      } catch (error) {
        // Dosya okunamadıysa devam et
        continue;
      }
    }
    
    return {
      totalFiles,
      getServerSideProps,
      getStaticProps,
      getStaticPaths,
      swr,
      reactQuery,
      fetch,
      axios
    };
  },
  
  /**
   * Cache stratejilerini analiz eder
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Cache stratejileri
   */
  async analyzeCacheStrategies(analyzer) {
    const issues = [];
    const recommendations = [];
    
    // Tüm komponentleri tara
    for (const [filePath, component] of analyzer.components.entries()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // getServerSideProps ve getStaticProps aynı dosyada kullanılıyor mu?
        if (content.includes('getServerSideProps') && content.includes('getStaticProps')) {
          issues.push({
            file: relativePath,
            issue: 'getServerSideProps ve getStaticProps aynı dosyada kullanılıyor',
            recommendation: 'Bu iki fonksiyonu aynı dosyada kullanmak yerine, ayrı dosyalara ayırın'
          });
        }
        
        // getStaticProps kullanılıyor ama revalidate yok
        if (content.includes('getStaticProps') && !content.includes('revalidate')) {
          issues.push({
            file: relativePath,
            issue: 'getStaticProps kullanılıyor ama revalidate belirtilmemiş',
            recommendation: 'ISR (Incremental Static Regeneration) için revalidate ekleyin'
          });
        }
        
        // fetch API kullanılıyor ama cache stratejisi yok
        if ((content.includes('fetch(') || content.includes('await fetch')) && 
            !content.includes('cache:') && !content.includes('next: { revalidate:')) {
          issues.push({
            file: relativePath,
            issue: 'fetch API kullanılıyor ama cache stratejisi belirtilmemiş',
            recommendation: 'fetch isteğine cache stratejisi ekleyin: { cache: "force-cache" } veya { cache: "no-store" }'
          });
        }
      } catch (error) {
        // Dosya okunamadıysa devam et
        continue;
      }
    }
    
    // Genel öneriler
    if (analyzer.appDir) {
      recommendations.push({
        title: 'App Router için Veri Fetching',
        description: 'App Router kullanıyorsanız, React Server Components ile veri fetching yapabilirsiniz. Bu, client-side JavaScript\'i azaltır ve SEO\'yu iyileştirir.'
      });
    }
    
    recommendations.push({
      title: 'SWR veya React Query Kullanımı',
      description: 'Client-side veri fetching için SWR veya React Query kullanın. Bu kütüphaneler, caching, revalidation, error handling gibi özellikleri otomatik olarak sağlar.'
    });
    
    recommendations.push({
      title: 'Incremental Static Regeneration (ISR)',
      description: 'Sık değişmeyen veriler için getStaticProps ile ISR kullanın. Bu, statik sayfaların belirli aralıklarla yeniden oluşturulmasını sağlar.'
    });
    
    return {
      issues,
      recommendations
    };
  },
  
  /**
   * getServerSideProps için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {number|null} revalidate - Revalidate değeri
   * @returns {string} - Öneri
   */
  getServerSidePropsRecommendation(content, revalidate) {
    if (revalidate) {
      return 'getServerSideProps ile revalidate kullanmak yerine, getStaticProps kullanmayı düşünün';
    }
    
    if (content.includes('req.cookies') || content.includes('req.headers')) {
      return 'Request bilgilerine ihtiyaç duyduğunuz için getServerSideProps doğru bir seçim';
    }
    
    return 'Eğer veri sık değişmiyorsa, getStaticProps + revalidate (ISR) kullanmayı düşünün';
  },
  
  /**
   * getStaticProps için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {number|null} revalidate - Revalidate değeri
   * @returns {string} - Öneri
   */
  getStaticPropsRecommendation(content, revalidate) {
    if (!revalidate) {
      return 'Veri değişebiliyorsa, revalidate ekleyerek ISR (Incremental Static Regeneration) kullanın';
    }
    
    if (revalidate < 10) {
      return 'Revalidate değeri çok düşük. Gereksiz yeniden oluşturmaları önlemek için daha yüksek bir değer kullanmayı düşünün';
    }
    
    return 'getStaticProps + revalidate (ISR) iyi bir seçim';
  },
  
  /**
   * getStaticPaths için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {string|null} fallback - Fallback değeri
   * @returns {string} - Öneri
   */
  getStaticPathsRecommendation(content, fallback) {
    if (fallback === 'false') {
      return 'fallback: false, bilinmeyen path\'ler için 404 döndürür. Eğer yeni içerikler ekleniyorsa, fallback: "blocking" veya fallback: true kullanmayı düşünün';
    }
    
    if (fallback === 'blocking') {
      return 'fallback: "blocking", iyi bir seçim. Bilinmeyen path\'ler için SSR gibi davranır';
    }
    
    if (fallback === 'true') {
      return 'fallback: true ile, loading state göstermeyi unutmayın';
    }
    
    return 'getStaticPaths için fallback değeri belirtin';
  },
  
  /**
   * SWR için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @returns {string} - Öneri
   */
  getSWRRecommendation(content) {
    if (!content.includes('revalidateOnFocus')) {
      return 'revalidateOnFocus, revalidateOnReconnect gibi seçenekleri belirtin';
    }
    
    if (!content.includes('dedupingInterval')) {
      return 'Gereksiz istekleri önlemek için dedupingInterval ekleyin';
    }
    
    return 'SWR iyi bir client-side veri fetching seçimi';
  },
  
  /**
   * React Query için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {number|null} staleTime - StaleTime değeri
   * @returns {string} - Öneri
   */
  getReactQueryRecommendation(content, staleTime) {
    if (staleTime === null) {
      return 'staleTime ve cacheTime değerlerini belirtin';
    }
    
    if (staleTime === 0) {
      return 'staleTime: 0, her render\'da yeni veri çeker. Gereksiz istekleri önlemek için daha yüksek bir değer kullanmayı düşünün';
    }
    
    return 'React Query iyi bir client-side veri fetching seçimi';
  },
  
  /**
   * Fetch API için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {string|null} cache - Cache değeri
   * @returns {string} - Öneri
   */
  getFetchRecommendation(content, cache) {
    if (cache === null) {
      return 'fetch isteğine cache stratejisi ekleyin: { cache: "force-cache" } veya { cache: "no-store" }';
    }
    
    if (cache === 'force-cache') {
      return 'force-cache, statik veriler için iyi bir seçim';
    }
    
    if (cache === 'no-store') {
      return 'no-store, dinamik veriler için iyi bir seçim';
    }
    
    return 'fetch API için uygun cache stratejisi seçin';
  },
  
  /**
   * Görselleştirme fonksiyonları
   */
  visualize: {
    /**
     * Metin formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - Metin formatında görselleştirme
     */
    text(results) {
      let output = '# Veri Fetching Analizi\n\n';
      
      // Veri fetching yöntemleri
      output += '## Veri Fetching Yöntemleri\n\n';
      
      // getServerSideProps
      if (results.results.fetchingMethods.getServerSideProps.length > 0) {
        output += '### getServerSideProps\n\n';
        results.results.fetchingMethods.getServerSideProps.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.revalidate !== null) {
            output += `  - Revalidate: ${item.revalidate} saniye\n`;
          }
          output += `  - Öneri: ${item.recommendation}\n\n`;
        });
      }
      
      // getStaticProps
      if (results.results.fetchingMethods.getStaticProps.length > 0) {
        output += '### getStaticProps\n\n';
        results.results.fetchingMethods.getStaticProps.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.revalidate !== null) {
            output += `  - Revalidate: ${item.revalidate} saniye\n`;
          } else {
            output += `  - Revalidate: Belirtilmemiş\n`;
          }
          output += `  - Öneri: ${item.recommendation}\n\n`;
        });
      }
      
      // getStaticPaths
      if (results.results.fetchingMethods.getStaticPaths.length > 0) {
        output += '### getStaticPaths\n\n';
        results.results.fetchingMethods.getStaticPaths.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.fallback !== null) {
            output += `  - Fallback: ${item.fallback}\n`;
          } else {
            output += `  - Fallback: Belirtilmemiş\n`;
          }
          output += `  - Öneri: ${item.recommendation}\n\n`;
        });
      }
      
      // Client-side veri fetching
      output += '## Client-side Veri Fetching\n\n';
      
      // SWR
      if (results.results.fetchingMethods.swr.length > 0) {
        output += '### SWR\n\n';
        results.results.fetchingMethods.swr.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.revalidateOnFocus !== null) {
            output += `  - revalidateOnFocus: ${item.revalidateOnFocus}\n`;
          }
          output += `  - Öneri: ${item.recommendation}\n\n`;
        });
      }
      
      // React Query
      if (results.results.fetchingMethods.reactQuery.length > 0) {
        output += '### React Query\n\n';
        results.results.fetchingMethods.reactQuery.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.staleTime !== null) {
            output += `  - staleTime: ${item.staleTime} ms\n`;
          }
          output += `  - Öneri: ${item.recommendation}\n\n`;
        });
      }
      
      // Fetch API
      if (results.results.fetchingMethods.fetch.length > 0) {
        output += '### Fetch API\n\n';
        results.results.fetchingMethods.fetch.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.cache !== null) {
            output += `  - Cache: ${item.cache}\n`;
          } else {
            output += `  - Cache: Belirtilmemiş\n`;
          }
          output += `  - Öneri: ${item.recommendation}\n\n`;
        });
      }
      
      // Axios
      if (results.results.fetchingMethods.axios.length > 0) {
        output += '### Axios\n\n';
        results.results.fetchingMethods.axios.forEach(item => {
          output += `- **${item.file}**\n`;
          output += `  - Öneri: ${item.recommendation}\n\n`;
        });
      }
      
      // Cache stratejileri
      output += '## Cache Stratejileri\n\n';
      
      // Sorunlar
      if (results.results.cacheStrategies.issues.length > 0) {
        output += '### Tespit Edilen Sorunlar\n\n';
        results.results.cacheStrategies.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - Sorun: ${issue.issue}\n`;
          output += `  - Öneri: ${issue.recommendation}\n\n`;
        });
      } else {
        output += '### Tespit Edilen Sorunlar\n\n';
        output += 'Herhangi bir sorun tespit edilmedi. Harika!\n\n';
      }
      
      // Genel öneriler
      output += '### Genel Öneriler\n\n';
      results.results.cacheStrategies.recommendations.forEach(recommendation => {
        output += `- **${recommendation.title}**\n`;
        output += `  - ${recommendation.description}\n\n`;
      });
      
      return output;
    },
    
    /**
     * HTML formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - HTML formatında görselleştirme
     */
    html(results) {
      let html = `
<div class="data-fetching-container">
  <h2>Veri Fetching Analizi</h2>
  
  <!-- Veri Fetching Yöntemleri -->
  <div class="section">
    <h3>Veri Fetching Yöntemleri</h3>`;
      
      // getServerSideProps
      if (results.results.fetchingMethods.getServerSideProps.length > 0) {
        html += `
    <div class="subsection">
      <h4>getServerSideProps</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.getServerSideProps.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.revalidate !== null) {
            html += `
          <div class="method-detail">Revalidate: ${item.revalidate} saniye</div>`;
          }
          
          html += `
          <div class="method-recommendation">Öneri: ${item.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // getStaticProps
      if (results.results.fetchingMethods.getStaticProps.length > 0) {
        html += `
    <div class="subsection">
      <h4>getStaticProps</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.getStaticProps.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.revalidate !== null) {
            html += `
          <div class="method-detail">Revalidate: ${item.revalidate} saniye</div>`;
          } else {
            html += `
          <div class="method-detail warning">Revalidate: Belirtilmemiş</div>`;
          }
          
          html += `
          <div class="method-recommendation">Öneri: ${item.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // getStaticPaths
      if (results.results.fetchingMethods.getStaticPaths.length > 0) {
        html += `
    <div class="subsection">
      <h4>getStaticPaths</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.getStaticPaths.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.fallback !== null) {
            html += `
          <div class="method-detail">Fallback: ${item.fallback}</div>`;
          } else {
            html += `
          <div class="method-detail warning">Fallback: Belirtilmemiş</div>`;
          }
          
          html += `
          <div class="method-recommendation">Öneri: ${item.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // Client-side veri fetching
      html += `
  </div>
  
  <!-- Client-side Veri Fetching -->
  <div class="section">
    <h3>Client-side Veri Fetching</h3>`;
      
      // SWR
      if (results.results.fetchingMethods.swr.length > 0) {
        html += `
    <div class="subsection">
      <h4>SWR</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.swr.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.revalidateOnFocus !== null) {
            html += `
          <div class="method-detail">revalidateOnFocus: ${item.revalidateOnFocus}</div>`;
          }
          
          html += `
          <div class="method-recommendation">Öneri: ${item.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // React Query
      if (results.results.fetchingMethods.reactQuery.length > 0) {
        html += `
    <div class="subsection">
      <h4>React Query</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.reactQuery.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.staleTime !== null) {
            html += `
          <div class="method-detail">staleTime: ${item.staleTime} ms</div>`;
          }
          
          html += `
          <div class="method-recommendation">Öneri: ${item.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // Fetch API
      if (results.results.fetchingMethods.fetch.length > 0) {
        html += `
    <div class="subsection">
      <h4>Fetch API</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.fetch.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.cache !== null) {
            html += `
          <div class="method-detail">Cache: ${item.cache}</div>`;
          } else {
            html += `
          <div class="method-detail warning">Cache: Belirtilmemiş</div>`;
          }
          
          html += `
          <div class="method-recommendation">Öneri: ${item.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // Axios
      if (results.results.fetchingMethods.axios.length > 0) {
        html += `
    <div class="subsection">
      <h4>Axios</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.axios.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>
          <div class="method-recommendation">Öneri: ${item.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // Cache stratejileri
      html += `
  </div>
  
  <!-- Cache Stratejileri -->
  <div class="section">
    <h3>Cache Stratejileri</h3>`;
      
      // Sorunlar
      html += `
    <div class="subsection">
      <h4>Tespit Edilen Sorunlar</h4>`;
      
      if (results.results.cacheStrategies.issues.length > 0) {
        html += `
      <ul class="issue-list">`;
        
        results.results.cacheStrategies.issues.forEach(issue => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${issue.file}</div>
          <div class="issue-description">Sorun: ${issue.issue}</div>
          <div class="issue-recommendation">Öneri: ${issue.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>`;
      } else {
        html += `
      <div class="success-message">
        <p>✅ Herhangi bir sorun tespit edilmedi. Harika!</p>
      </div>`;
      }
      
      // Genel öneriler
      html += `
    </div>
    
    <div class="subsection">
      <h4>Genel Öneriler</h4>
      <ul class="recommendation-list">`;
      
      results.results.cacheStrategies.recommendations.forEach(recommendation => {
        html += `
        <li class="recommendation-item">
          <div class="recommendation-title">${recommendation.title}</div>
          <div class="recommendation-description">${recommendation.description}</div>
        </li>`;
      });
      
      html += `
      </ul>
    </div>
  </div>
</div>`;
      
      return html;
    },
    
    /**
     * JSON formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - JSON formatında görselleştirme
     */
    json(results) {
      return JSON.stringify(results, null, 2);
    }
  }
};
