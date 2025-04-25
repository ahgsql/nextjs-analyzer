const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath } = require('../../utils');

/**
 * Route Analizi Modülü
 */
module.exports = {
  name: 'routing',
  description: 'Next.js projelerinde route analizi yapar',
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    const routes = [];
    
    // App Router (Next.js 13+)
    if (analyzer.appDir) {
      const appRoutes = await this.analyzeAppRouter(analyzer.appDir, analyzer.projectPath);
      routes.push(...appRoutes);
    }
    
    // Pages Router
    if (analyzer.pagesDir) {
      const pageRoutes = await this.analyzePagesRouter(analyzer.pagesDir, analyzer.projectPath);
      routes.push(...pageRoutes);
    }
    
    return {
      results: {
        routes
      },
      metadata: {
        totalRoutes: routes.length,
        dynamicRoutes: routes.filter(r => r.isDynamic).length,
        staticRoutes: routes.filter(r => !r.isDynamic).length,
        apiRoutes: routes.filter(r => r.type === 'api').length,
        pageRoutes: routes.filter(r => r.type === 'page').length
      }
    };
  },
  
  /**
   * App Router analizi yapar
   * @param {string} appDir - App dizini yolu
   * @param {string} projectPath - Proje kök dizini
   * @returns {Array<Object>} - Route'lar
   */
  async analyzeAppRouter(appDir, projectPath) {
    const routes = [];
    const files = findFiles(appDir);
    
    for (const file of files) {
      // page.js, route.js dosyalarını bul
      if (path.basename(file) === 'page.js' || path.basename(file) === 'page.tsx' ||
          path.basename(file) === 'route.js' || path.basename(file) === 'route.tsx') {
        
        const relativePath = path.relative(appDir, file);
        const routePath = this.filePathToRoutePath(relativePath);
        const isDynamic = routePath.includes('[') && routePath.includes(']');
        
        routes.push({
          path: routePath,
          filePath: getRelativePath(file, projectPath),
          routerType: 'app',
          type: path.basename(file).startsWith('page') ? 'page' : 'api',
          isDynamic,
          params: this.extractDynamicParams(routePath)
        });
      }
    }
    
    return routes;
  },
  
  /**
   * Pages Router analizi yapar
   * @param {string} pagesDir - Pages dizini yolu
   * @param {string} projectPath - Proje kök dizini
   * @returns {Array<Object>} - Route'lar
   */
  async analyzePagesRouter(pagesDir, projectPath) {
    const routes = [];
    const files = findFiles(pagesDir);
    
    for (const file of files) {
      // api/ dizinindeki dosyaları API route olarak işaretle
      const relativePath = path.relative(pagesDir, file);
      const isApiRoute = relativePath.startsWith('api/') || relativePath.includes('/api/');
      
      // _app.js, _document.js gibi özel dosyaları atla
      if (path.basename(file).startsWith('_')) {
        continue;
      }
      
      const routePath = this.filePathToRoutePath(relativePath);
      const isDynamic = routePath.includes('[') && routePath.includes(']');
      
      routes.push({
        path: routePath,
        filePath: getRelativePath(file, projectPath),
        routerType: 'pages',
        type: isApiRoute ? 'api' : 'page',
        isDynamic,
        params: this.extractDynamicParams(routePath)
      });
    }
    
    return routes;
  },
  
  /**
   * Dosya yolunu route path'ine dönüştürür
   * @param {string} filePath - Dosya yolu
   * @returns {string} - Route path'i
   */
  filePathToRoutePath(filePath) {
    // Dosya yolunu route path'ine dönüştür
    // Örn: app/blog/[slug]/page.js -> /blog/[slug]
    let routePath = filePath
      .replace(/\.(js|jsx|ts|tsx)$/, '')
      .replace(/\/page$/, '')
      .replace(/\/route$/, '');
    
    // Index route'ları düzelt
    if (routePath === 'index') return '/';
    if (routePath.endsWith('/index')) {
      routePath = routePath.replace(/\/index$/, '');
    }
    
    return '/' + routePath;
  },
  
  /**
   * Dinamik parametreleri çıkarır
   * @param {string} routePath - Route path'i
   * @returns {Array<string>} - Dinamik parametreler
   */
  extractDynamicParams(routePath) {
    // Dinamik parametreleri çıkar
    // Örn: /blog/[slug]/[id] -> ['slug', 'id']
    const params = [];
    const regex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = regex.exec(routePath)) !== null) {
      params.push(match[1]);
    }
    
    return params;
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
      let output = '# Route Analizi\n\n';
      
      if (results.results.routes.length === 0) {
        output += 'Hiç route bulunamadı.\n';
        return output;
      }
      
      // App Router route'ları
      const appRoutes = results.results.routes.filter(route => route.routerType === 'app');
      if (appRoutes.length > 0) {
        output += '## App Router\n\n';
        
        // Sayfa route'ları
        const appPageRoutes = appRoutes.filter(route => route.type === 'page');
        if (appPageRoutes.length > 0) {
          output += '### Sayfalar\n\n';
          
          // Statik route'lar
          const staticAppPageRoutes = appPageRoutes.filter(route => !route.isDynamic);
          if (staticAppPageRoutes.length > 0) {
            output += '#### Statik Sayfalar\n\n';
            staticAppPageRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath})\n`;
            });
            output += '\n';
          }
          
          // Dinamik route'lar
          const dynamicAppPageRoutes = appPageRoutes.filter(route => route.isDynamic);
          if (dynamicAppPageRoutes.length > 0) {
            output += '#### Dinamik Sayfalar\n\n';
            dynamicAppPageRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath}) - Parametreler: ${route.params.join(', ')}\n`;
            });
            output += '\n';
          }
        }
        
        // API route'ları
        const appApiRoutes = appRoutes.filter(route => route.type === 'api');
        if (appApiRoutes.length > 0) {
          output += '### API Route\'lar\n\n';
          
          // Statik API route'lar
          const staticAppApiRoutes = appApiRoutes.filter(route => !route.isDynamic);
          if (staticAppApiRoutes.length > 0) {
            output += '#### Statik API Route\'lar\n\n';
            staticAppApiRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath})\n`;
            });
            output += '\n';
          }
          
          // Dinamik API route'lar
          const dynamicAppApiRoutes = appApiRoutes.filter(route => route.isDynamic);
          if (dynamicAppApiRoutes.length > 0) {
            output += '#### Dinamik API Route\'lar\n\n';
            dynamicAppApiRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath}) - Parametreler: ${route.params.join(', ')}\n`;
            });
            output += '\n';
          }
        }
      }
      
      // Pages Router route'ları
      const pagesRoutes = results.results.routes.filter(route => route.routerType === 'pages');
      if (pagesRoutes.length > 0) {
        output += '## Pages Router\n\n';
        
        // Sayfa route'ları
        const pagesPageRoutes = pagesRoutes.filter(route => route.type === 'page');
        if (pagesPageRoutes.length > 0) {
          output += '### Sayfalar\n\n';
          
          // Statik route'lar
          const staticPagesPageRoutes = pagesPageRoutes.filter(route => !route.isDynamic);
          if (staticPagesPageRoutes.length > 0) {
            output += '#### Statik Sayfalar\n\n';
            staticPagesPageRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath})\n`;
            });
            output += '\n';
          }
          
          // Dinamik route'lar
          const dynamicPagesPageRoutes = pagesPageRoutes.filter(route => route.isDynamic);
          if (dynamicPagesPageRoutes.length > 0) {
            output += '#### Dinamik Sayfalar\n\n';
            dynamicPagesPageRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath}) - Parametreler: ${route.params.join(', ')}\n`;
            });
            output += '\n';
          }
        }
        
        // API route'ları
        const pagesApiRoutes = pagesRoutes.filter(route => route.type === 'api');
        if (pagesApiRoutes.length > 0) {
          output += '### API Route\'lar\n\n';
          
          // Statik API route'lar
          const staticPagesApiRoutes = pagesApiRoutes.filter(route => !route.isDynamic);
          if (staticPagesApiRoutes.length > 0) {
            output += '#### Statik API Route\'lar\n\n';
            staticPagesApiRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath})\n`;
            });
            output += '\n';
          }
          
          // Dinamik API route'lar
          const dynamicPagesApiRoutes = pagesApiRoutes.filter(route => route.isDynamic);
          if (dynamicPagesApiRoutes.length > 0) {
            output += '#### Dinamik API Route\'lar\n\n';
            dynamicPagesApiRoutes.forEach(route => {
              output += `- ${route.path} (${route.filePath}) - Parametreler: ${route.params.join(', ')}\n`;
            });
            output += '\n';
          }
        }
      }
      
      return output;
    },
    
    /**
     * HTML formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - HTML formatında görselleştirme
     */
    html(results) {
      let html = `
<div class="routing-container">
  <h2>Route Analizi</h2>`;
      
      if (results.results.routes.length === 0) {
        html += `
  <p>Hiç route bulunamadı.</p>
</div>`;
        return html;
      }
      
      // App Router route'ları
      const appRoutes = results.results.routes.filter(route => route.routerType === 'app');
      if (appRoutes.length > 0) {
        html += `
  <div class="router-section">
    <h3>App Router</h3>`;
        
        // Sayfa route'ları
        const appPageRoutes = appRoutes.filter(route => route.type === 'page');
        if (appPageRoutes.length > 0) {
          html += `
    <div class="route-type-section">
      <h4>Sayfalar</h4>`;
          
          // Statik route'lar
          const staticAppPageRoutes = appPageRoutes.filter(route => !route.isDynamic);
          if (staticAppPageRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Statik Sayfalar</h5>
        <ul class="route-list">`;
            
            staticAppPageRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          // Dinamik route'lar
          const dynamicAppPageRoutes = appPageRoutes.filter(route => route.isDynamic);
          if (dynamicAppPageRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Dinamik Sayfalar</h5>
        <ul class="route-list">`;
            
            dynamicAppPageRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
            <span class="route-params">Parametreler: ${route.params.join(', ')}</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          html += `
    </div>`;
        }
        
        // API route'ları
        const appApiRoutes = appRoutes.filter(route => route.type === 'api');
        if (appApiRoutes.length > 0) {
          html += `
    <div class="route-type-section">
      <h4>API Route'lar</h4>`;
          
          // Statik API route'lar
          const staticAppApiRoutes = appApiRoutes.filter(route => !route.isDynamic);
          if (staticAppApiRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Statik API Route'lar</h5>
        <ul class="route-list">`;
            
            staticAppApiRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          // Dinamik API route'lar
          const dynamicAppApiRoutes = appApiRoutes.filter(route => route.isDynamic);
          if (dynamicAppApiRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Dinamik API Route'lar</h5>
        <ul class="route-list">`;
            
            dynamicAppApiRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
            <span class="route-params">Parametreler: ${route.params.join(', ')}</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          html += `
    </div>`;
        }
        
        html += `
  </div>`;
      }
      
      // Pages Router route'ları
      const pagesRoutes = results.results.routes.filter(route => route.routerType === 'pages');
      if (pagesRoutes.length > 0) {
        html += `
  <div class="router-section">
    <h3>Pages Router</h3>`;
        
        // Sayfa route'ları
        const pagesPageRoutes = pagesRoutes.filter(route => route.type === 'page');
        if (pagesPageRoutes.length > 0) {
          html += `
    <div class="route-type-section">
      <h4>Sayfalar</h4>`;
          
          // Statik route'lar
          const staticPagesPageRoutes = pagesPageRoutes.filter(route => !route.isDynamic);
          if (staticPagesPageRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Statik Sayfalar</h5>
        <ul class="route-list">`;
            
            staticPagesPageRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          // Dinamik route'lar
          const dynamicPagesPageRoutes = pagesPageRoutes.filter(route => route.isDynamic);
          if (dynamicPagesPageRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Dinamik Sayfalar</h5>
        <ul class="route-list">`;
            
            dynamicPagesPageRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
            <span class="route-params">Parametreler: ${route.params.join(', ')}</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          html += `
    </div>`;
        }
        
        // API route'ları
        const pagesApiRoutes = pagesRoutes.filter(route => route.type === 'api');
        if (pagesApiRoutes.length > 0) {
          html += `
    <div class="route-type-section">
      <h4>API Route'lar</h4>`;
          
          // Statik API route'lar
          const staticPagesApiRoutes = pagesApiRoutes.filter(route => !route.isDynamic);
          if (staticPagesApiRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Statik API Route'lar</h5>
        <ul class="route-list">`;
            
            staticPagesApiRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          // Dinamik API route'lar
          const dynamicPagesApiRoutes = pagesApiRoutes.filter(route => route.isDynamic);
          if (dynamicPagesApiRoutes.length > 0) {
            html += `
      <div class="route-category">
        <h5>Dinamik API Route'lar</h5>
        <ul class="route-list">`;
            
            dynamicPagesApiRoutes.forEach(route => {
              html += `
          <li class="route-item">
            <span class="route-path">${route.path}</span>
            <span class="route-file">(${route.filePath})</span>
            <span class="route-params">Parametreler: ${route.params.join(', ')}</span>
          </li>`;
            });
            
            html += `
        </ul>
      </div>`;
          }
          
          html += `
    </div>`;
        }
        
        html += `
  </div>`;
      }
      
      html += `
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
