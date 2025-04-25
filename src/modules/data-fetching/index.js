const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath, i18n } = require('../../utils');

/**
 * Veri Fetching Analizi Modülü
 */
module.exports = {
  name: i18n.t('modules.data-fetching.name'),
  description: i18n.t('modules.data-fetching.description'),
  
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
            recommendation: i18n.t('modules.data-fetching.recommendations.axios.default')
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
            issue: i18n.t('modules.data-fetching.issues.bothDataFetchingMethods.issue'),
            recommendation: i18n.t('modules.data-fetching.issues.bothDataFetchingMethods.recommendation')
          });
        }
        
        // getStaticProps kullanılıyor ama revalidate yok
        if (content.includes('getStaticProps') && !content.includes('revalidate')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.data-fetching.issues.staticPropsNoRevalidate.issue'),
            recommendation: i18n.t('modules.data-fetching.issues.staticPropsNoRevalidate.recommendation')
          });
        }
        
        // fetch API kullanılıyor ama cache stratejisi yok
        if ((content.includes('fetch(') || content.includes('await fetch')) && 
            !content.includes('cache:') && !content.includes('next: { revalidate:')) {
          issues.push({
            file: relativePath,
            issue: i18n.t('modules.data-fetching.issues.fetchNoCache.issue'),
            recommendation: i18n.t('modules.data-fetching.issues.fetchNoCache.recommendation')
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
        title: i18n.t('modules.data-fetching.generalRecommendations.appRouter.title'),
        description: i18n.t('modules.data-fetching.generalRecommendations.appRouter.description')
      });
    }
    
    recommendations.push({
      title: i18n.t('modules.data-fetching.generalRecommendations.clientSide.title'),
      description: i18n.t('modules.data-fetching.generalRecommendations.clientSide.description')
    });
    
    recommendations.push({
      title: i18n.t('modules.data-fetching.generalRecommendations.isr.title'),
      description: i18n.t('modules.data-fetching.generalRecommendations.isr.description')
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
      return i18n.t('modules.data-fetching.recommendations.serverSideProps.withRevalidate');
    }
    
    if (content.includes('req.cookies') || content.includes('req.headers')) {
      return i18n.t('modules.data-fetching.recommendations.serverSideProps.withRequestData');
    }
    
    return i18n.t('modules.data-fetching.recommendations.serverSideProps.default');
  },
  
  /**
   * getStaticProps için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {number|null} revalidate - Revalidate değeri
   * @returns {string} - Öneri
   */
  getStaticPropsRecommendation(content, revalidate) {
    if (!revalidate) {
      return i18n.t('modules.data-fetching.recommendations.staticProps.noRevalidate');
    }
    
    if (revalidate < 10) {
      return i18n.t('modules.data-fetching.recommendations.staticProps.lowRevalidate');
    }
    
    return i18n.t('modules.data-fetching.recommendations.staticProps.default');
  },
  
  /**
   * getStaticPaths için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {string|null} fallback - Fallback değeri
   * @returns {string} - Öneri
   */
  getStaticPathsRecommendation(content, fallback) {
    if (fallback === 'false') {
      return i18n.t('modules.data-fetching.recommendations.staticPaths.fallbackFalse');
    }
    
    if (fallback === 'blocking') {
      return i18n.t('modules.data-fetching.recommendations.staticPaths.fallbackBlocking');
    }
    
    if (fallback === 'true') {
      return i18n.t('modules.data-fetching.recommendations.staticPaths.fallbackTrue');
    }
    
    return i18n.t('modules.data-fetching.recommendations.staticPaths.default');
  },
  
  /**
   * SWR için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @returns {string} - Öneri
   */
  getSWRRecommendation(content) {
    if (!content.includes('revalidateOnFocus')) {
      return i18n.t('modules.data-fetching.recommendations.swr.noRevalidateOnFocus');
    }
    
    if (!content.includes('dedupingInterval')) {
      return i18n.t('modules.data-fetching.recommendations.swr.noDedupingInterval');
    }
    
    return i18n.t('modules.data-fetching.recommendations.swr.default');
  },
  
  /**
   * React Query için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {number|null} staleTime - StaleTime değeri
   * @returns {string} - Öneri
   */
  getReactQueryRecommendation(content, staleTime) {
    if (staleTime === null) {
      return i18n.t('modules.data-fetching.recommendations.reactQuery.noStaleTime');
    }
    
    if (staleTime === 0) {
      return i18n.t('modules.data-fetching.recommendations.reactQuery.zeroStaleTime');
    }
    
    return i18n.t('modules.data-fetching.recommendations.reactQuery.default');
  },
  
  /**
   * Fetch API için öneri döndürür
   * @param {string} content - Dosya içeriği
   * @param {string|null} cache - Cache değeri
   * @returns {string} - Öneri
   */
  getFetchRecommendation(content, cache) {
    if (cache === null) {
      return i18n.t('modules.data-fetching.recommendations.fetch.noCache');
    }
    
    if (cache === 'force-cache') {
      return i18n.t('modules.data-fetching.recommendations.fetch.forceCache');
    }
    
    if (cache === 'no-store') {
      return i18n.t('modules.data-fetching.recommendations.fetch.noStore');
    }
    
    return i18n.t('modules.data-fetching.recommendations.fetch.default');
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
      let output = `# ${i18n.t('modules.data-fetching.visualize.title')}\n\n`;
      
      // Veri fetching yöntemleri
      output += `## ${i18n.t('modules.data-fetching.visualize.methods.title')}\n\n`;
      
      // getServerSideProps
      if (results.results.fetchingMethods.getServerSideProps.length > 0) {
        output += `### ${i18n.t('modules.data-fetching.visualize.methods.serverSideProps')}\n\n`;
        results.results.fetchingMethods.getServerSideProps.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.revalidate !== null) {
            output += `  - ${i18n.t('modules.data-fetching.visualize.methods.revalidate')}: ${item.revalidate} saniye\n`;
          }
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}\n\n`;
        });
      }
      
      // getStaticProps
      if (results.results.fetchingMethods.getStaticProps.length > 0) {
        output += `### ${i18n.t('modules.data-fetching.visualize.methods.staticProps')}\n\n`;
        results.results.fetchingMethods.getStaticProps.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.revalidate !== null) {
            output += `  - ${i18n.t('modules.data-fetching.visualize.methods.revalidate')}: ${item.revalidate} saniye\n`;
          } else {
            output += `  - ${i18n.t('modules.data-fetching.visualize.methods.revalidate')}: ${i18n.t('modules.data-fetching.visualize.methods.notSpecified')}\n`;
          }
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}\n\n`;
        });
      }
      
      // getStaticPaths
      if (results.results.fetchingMethods.getStaticPaths.length > 0) {
        output += `### ${i18n.t('modules.data-fetching.visualize.methods.staticPaths')}\n\n`;
        results.results.fetchingMethods.getStaticPaths.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.fallback !== null) {
            output += `  - ${i18n.t('modules.data-fetching.visualize.methods.fallback')}: ${item.fallback}\n`;
          } else {
            output += `  - ${i18n.t('modules.data-fetching.visualize.methods.fallback')}: ${i18n.t('modules.data-fetching.visualize.methods.notSpecified')}\n`;
          }
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}\n\n`;
        });
      }
      
      // Client-side veri fetching
      output += `## ${i18n.t('modules.data-fetching.visualize.clientSide.title')}\n\n`;
      
      // SWR
      if (results.results.fetchingMethods.swr.length > 0) {
        output += '### SWR\n\n';
        results.results.fetchingMethods.swr.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.revalidateOnFocus !== null) {
            output += `  - ${i18n.t('modules.data-fetching.visualize.clientSide.revalidateOnFocus')}: ${item.revalidateOnFocus}\n`;
          }
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}\n\n`;
        });
      }
      
      // React Query
      if (results.results.fetchingMethods.reactQuery.length > 0) {
        output += '### React Query\n\n';
        results.results.fetchingMethods.reactQuery.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.staleTime !== null) {
            output += `  - ${i18n.t('modules.data-fetching.visualize.clientSide.staleTime')}: ${item.staleTime} ms\n`;
          }
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}\n\n`;
        });
      }
      
      // Fetch API
      if (results.results.fetchingMethods.fetch.length > 0) {
        output += '### Fetch API\n\n';
        results.results.fetchingMethods.fetch.forEach(item => {
          output += `- **${item.file}**\n`;
          if (item.cache !== null) {
            output += `  - ${i18n.t('modules.data-fetching.visualize.clientSide.cache')}: ${item.cache}\n`;
          } else {
            output += `  - ${i18n.t('modules.data-fetching.visualize.clientSide.cache')}: ${i18n.t('modules.data-fetching.visualize.methods.notSpecified')}\n`;
          }
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}\n\n`;
        });
      }
      
      // Axios
      if (results.results.fetchingMethods.axios.length > 0) {
        output += '### Axios\n\n';
        results.results.fetchingMethods.axios.forEach(item => {
          output += `- **${item.file}**\n`;
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}\n\n`;
        });
      }
      
      // Cache stratejileri
      output += `## ${i18n.t('modules.data-fetching.visualize.cacheStrategies.title')}\n\n`;
      
      // Sorunlar
      if (results.results.cacheStrategies.issues.length > 0) {
        output += `### ${i18n.t('modules.data-fetching.visualize.cacheStrategies.issues.title')}\n\n`;
        results.results.cacheStrategies.issues.forEach(issue => {
          output += `- **${issue.file}**\n`;
          output += `  - ${i18n.t('modules.data-fetching.visualize.cacheStrategies.issues.issue')}: ${issue.issue}\n`;
          output += `  - ${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${issue.recommendation}\n\n`;
        });
      } else {
        output += `### ${i18n.t('modules.data-fetching.visualize.cacheStrategies.issues.title')}\n\n`;
        output += `${i18n.t('modules.data-fetching.visualize.cacheStrategies.issues.noIssues')}\n\n`;
      }
      
      // Genel öneriler
      output += `### ${i18n.t('modules.data-fetching.visualize.cacheStrategies.recommendations.title')}\n\n`;
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
  <h2>${i18n.t('modules.data-fetching.visualize.title')}</h2>
  
  <!-- Veri Fetching Yöntemleri -->
  <div class="section">
    <h3>${i18n.t('modules.data-fetching.visualize.methods.title')}</h3>`;
      
      // getServerSideProps
      if (results.results.fetchingMethods.getServerSideProps.length > 0) {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.data-fetching.visualize.methods.serverSideProps')}</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.getServerSideProps.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.revalidate !== null) {
            html += `
          <div class="method-detail">${i18n.t('modules.data-fetching.visualize.methods.revalidate')}: ${item.revalidate} saniye</div>`;
          }
          
          html += `
          <div class="method-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}</div>
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
      <h4>${i18n.t('modules.data-fetching.visualize.methods.staticProps')}</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.getStaticProps.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.revalidate !== null) {
            html += `
          <div class="method-detail">${i18n.t('modules.data-fetching.visualize.methods.revalidate')}: ${item.revalidate} saniye</div>`;
          } else {
            html += `
          <div class="method-detail warning">${i18n.t('modules.data-fetching.visualize.methods.revalidate')}: ${i18n.t('modules.data-fetching.visualize.methods.notSpecified')}</div>`;
          }
          
          html += `
          <div class="method-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}</div>
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
      <h4>${i18n.t('modules.data-fetching.visualize.methods.staticPaths')}</h4>
      <ul class="method-list">`;
        
        results.results.fetchingMethods.getStaticPaths.forEach(item => {
          html += `
        <li class="method-item">
          <div class="method-file">${item.file}</div>`;
          
          if (item.fallback !== null) {
            html += `
          <div class="method-detail">${i18n.t('modules.data-fetching.visualize.methods.fallback')}: ${item.fallback}</div>`;
          } else {
            html += `
          <div class="method-detail warning">${i18n.t('modules.data-fetching.visualize.methods.fallback')}: ${i18n.t('modules.data-fetching.visualize.methods.notSpecified')}</div>`;
          }
          
          html += `
          <div class="method-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}</div>
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
    <h3>${i18n.t('modules.data-fetching.visualize.clientSide.title')}</h3>`;
      
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
          <div class="method-detail">${i18n.t('modules.data-fetching.visualize.clientSide.revalidateOnFocus')}: ${item.revalidateOnFocus}</div>`;
          }
          
          html += `
          <div class="method-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}</div>
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
          <div class="method-detail">${i18n.t('modules.data-fetching.visualize.clientSide.staleTime')}: ${item.staleTime} ms</div>`;
          }
          
          html += `
          <div class="method-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}</div>
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
          <div class="method-detail">${i18n.t('modules.data-fetching.visualize.clientSide.cache')}: ${item.cache}</div>`;
          } else {
            html += `
          <div class="method-detail warning">${i18n.t('modules.data-fetching.visualize.clientSide.cache')}: ${i18n.t('modules.data-fetching.visualize.methods.notSpecified')}</div>`;
          }
          
          html += `
          <div class="method-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}</div>
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
          <div class="method-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${item.recommendation}</div>
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
    <h3>${i18n.t('modules.data-fetching.visualize.cacheStrategies.title')}</h3>`;
      
      // Sorunlar
      html += `
    <div class="subsection">
      <h4>${i18n.t('modules.data-fetching.visualize.cacheStrategies.issues.title')}</h4>`;
      
      if (results.results.cacheStrategies.issues.length > 0) {
        html += `
      <ul class="issue-list">`;
        
        results.results.cacheStrategies.issues.forEach(issue => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${issue.file}</div>
          <div class="issue-description">${i18n.t('modules.data-fetching.visualize.cacheStrategies.issues.issue')}: ${issue.issue}</div>
          <div class="issue-recommendation">${i18n.t('modules.data-fetching.visualize.methods.recommendation')}: ${issue.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>`;
      } else {
        html += `
      <div class="success-message">
        <p>✅ ${i18n.t('modules.data-fetching.visualize.cacheStrategies.issues.noIssues')}</p>
      </div>`;
      }
      
      // Genel öneriler
      html += `
    </div>
    
    <div class="subsection">
      <h4>${i18n.t('modules.data-fetching.visualize.cacheStrategies.recommendations.title')}</h4>
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
