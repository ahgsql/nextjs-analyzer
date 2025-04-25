const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath, i18n } = require('../../utils');

/**
 * Performans Analizi Modülü
 */
module.exports = {
  name: i18n.t('modules.performance.name'),
  description: i18n.t('modules.performance.description'),
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Image optimizasyon kontrolü
    const imageOptimizationResults = await this.checkImageOptimization(analyzer);
    
    // Bundle size tahmini
    const bundleSizeResults = await this.estimateBundleSize(analyzer);
    
    return {
      results: {
        imageOptimization: imageOptimizationResults,
        bundleSize: bundleSizeResults
      },
      metadata: {
        totalImagesChecked: imageOptimizationResults.totalImages,
        nonOptimizedImages: imageOptimizationResults.nonOptimizedImages.length,
        largeComponents: bundleSizeResults.largeComponents.length
      }
    };
  },
  
  /**
   * Image optimizasyon durumunu kontrol eder
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Image optimizasyon sonuçları
   */
  async checkImageOptimization(analyzer) {
    const nonOptimizedImages = [];
    let totalImages = 0;
    
    // Tüm komponentleri tara
    for (const [filePath, component] of analyzer.components.entries()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // HTML img tag'lerini kontrol et
        const imgTagRegex = /<img\s+[^>]*src\s*=\s*['"]([^'"]+)['"]/g;
        let match;
        
        while ((match = imgTagRegex.exec(content)) !== null) {
          totalImages++;
          const imgSrc = match[1];
          
          // Next.js Image komponenti kullanılmıyor
          if (!content.includes('next/image') && !content.includes('@next/image')) {
            nonOptimizedImages.push({
              file: getRelativePath(filePath, analyzer.projectPath),
              imageSrc: imgSrc,
              issue: i18n.t('modules.performance.imageOptimization.issues.noNextImage'),
              recommendation: i18n.t('modules.performance.imageOptimization.recommendations.useNextImage')
            });
          }
        }
        
        // Next.js Image komponenti kullanımını kontrol et
        const nextImageRegex = /<Image\s+[^>]*src\s*=\s*['"]([^'"]+)['"]/g;
        while ((match = nextImageRegex.exec(content)) !== null) {
          totalImages++;
          
          // width ve height attribute'larını kontrol et
          const hasWidth = /<Image\s+[^>]*width\s*=/.test(content);
          const hasHeight = /<Image\s+[^>]*height\s*=/.test(content);
          
          if (!hasWidth || !hasHeight) {
            nonOptimizedImages.push({
              file: getRelativePath(filePath, analyzer.projectPath),
              imageSrc: match[1],
              issue: i18n.t('modules.performance.imageOptimization.issues.noWidthHeight'),
              recommendation: i18n.t('modules.performance.imageOptimization.recommendations.addWidthHeight')
            });
          }
          
          // priority attribute'unu kontrol et (LCP için)
          if (content.includes('hero') || content.includes('banner') || content.includes('carousel')) {
            const hasPriority = /<Image\s+[^>]*priority\s*[=\s>]/.test(content);
            
            if (!hasPriority) {
              nonOptimizedImages.push({
                file: getRelativePath(filePath, analyzer.projectPath),
                imageSrc: match[1],
                issue: i18n.t('modules.performance.imageOptimization.issues.noPriority'),
                recommendation: i18n.t('modules.performance.imageOptimization.recommendations.addPriority')
              });
            }
          }
        }
      } catch (error) {
        // Dosya okunamadıysa devam et
        continue;
      }
    }
    
    return {
      totalImages,
      nonOptimizedImages,
      isFullyOptimized: nonOptimizedImages.length === 0
    };
  },
  
  /**
   * Bundle size tahminini yapar
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Object} - Bundle size sonuçları
   */
  async estimateBundleSize(analyzer) {
    const largeComponents = [];
    const largeImports = [];
    
    // Tüm komponentleri tara
    for (const [filePath, component] of analyzer.components.entries()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileSize = fs.statSync(filePath).size;
        const relativePath = getRelativePath(filePath, analyzer.projectPath);
        
        // Büyük dosyaları tespit et (10KB'den büyük)
        if (fileSize > 10 * 1024) {
          largeComponents.push({
            file: relativePath,
            size: fileSize,
            recommendation: i18n.t('modules.performance.bundleSize.largeComponents.recommendation')
          });
        }
        
        // Büyük kütüphaneleri tespit et
        const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^\s,]+|[^\s,{]+)\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          
          // Node modüllerini kontrol et (3rd party kütüphaneler)
          if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
            // Büyük olduğu bilinen kütüphaneler
            const largeLibraries = [
              'lodash',
              'moment',
              'chart.js',
              'three.js',
              'monaco-editor',
              'draft-js',
              'quill',
              'react-bootstrap',
              'material-ui',
              '@material-ui/core',
              '@mui/material'
            ];
            
            for (const lib of largeLibraries) {
              if (importPath === lib || importPath.startsWith(`${lib}/`)) {
                largeImports.push({
                  file: relativePath,
                  library: importPath,
                  recommendation: this.getLibraryRecommendation(lib)
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        // Dosya okunamadıysa devam et
        continue;
      }
    }
    
    return {
      largeComponents,
      largeImports
    };
  },
  
  /**
   * Kütüphane için öneriler döndürür
   * @param {string} library - Kütüphane adı
   * @returns {string} - Öneri
   */
  getLibraryRecommendation(library) {
    const recommendations = {
      'lodash': i18n.t('modules.performance.bundleSize.largeImports.recommendations.lodash'),
      'moment': i18n.t('modules.performance.bundleSize.largeImports.recommendations.moment'),
      'chart.js': i18n.t('modules.performance.bundleSize.largeImports.recommendations.chartjs'),
      'three.js': i18n.t('modules.performance.bundleSize.largeImports.recommendations.threejs'),
      'monaco-editor': i18n.t('modules.performance.bundleSize.largeImports.recommendations.monaco'),
      'draft-js': i18n.t('modules.performance.bundleSize.largeImports.recommendations.draftjs'),
      'quill': i18n.t('modules.performance.bundleSize.largeImports.recommendations.quill'),
      'react-bootstrap': i18n.t('modules.performance.bundleSize.largeImports.recommendations.reactBootstrap'),
      'material-ui': i18n.t('modules.performance.bundleSize.largeImports.recommendations.materialUi'),
      '@material-ui/core': i18n.t('modules.performance.bundleSize.largeImports.recommendations.materialCore'),
      '@mui/material': i18n.t('modules.performance.bundleSize.largeImports.recommendations.mui')
    };
    
    return recommendations[library] || i18n.t('modules.performance.bundleSize.largeImports.recommendations.default');
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
      let output = `# ${i18n.t('modules.performance.visualize.title')}\n\n`;
      
      // Image optimizasyon sonuçları
      output += `## ${i18n.t('modules.performance.imageOptimization.title')}\n\n`;
      
      if (results.results.imageOptimization.isFullyOptimized) {
        output += `${i18n.t('modules.performance.imageOptimization.fullyOptimized')}\n\n`;
      } else {
        output += `${i18n.t('modules.performance.imageOptimization.notFullyOptimized', { 
          totalImages: results.results.imageOptimization.totalImages, 
          nonOptimizedCount: results.results.imageOptimization.nonOptimizedImages.length 
        })}\n\n`;
        
        output += `### ${i18n.t('modules.performance.imageOptimization.nonOptimizedImages')}\n\n`;
        results.results.imageOptimization.nonOptimizedImages.forEach(image => {
          output += `- **${image.file}**: ${image.imageSrc}\n`;
          output += `  - ${i18n.t('modules.performance.visualize.issue')}: ${image.issue}\n`;
          output += `  - ${i18n.t('modules.performance.visualize.recommendation')}: ${image.recommendation}\n\n`;
        });
      }
      
      // Bundle size sonuçları
      output += `## ${i18n.t('modules.performance.bundleSize.title')}\n\n`;
      
      // Büyük komponentler
      if (results.results.bundleSize.largeComponents.length > 0) {
        output += `### ${i18n.t('modules.performance.bundleSize.largeComponents.title')}\n\n`;
        results.results.bundleSize.largeComponents.forEach(component => {
          output += `- **${component.file}**: ${(component.size / 1024).toFixed(2)} KB\n`;
          output += `  - ${i18n.t('modules.performance.visualize.recommendation')}: ${component.recommendation}\n\n`;
        });
      } else {
        output += `${i18n.t('modules.performance.bundleSize.largeComponents.noLargeComponents')}\n\n`;
      }
      
      // Büyük kütüphaneler
      if (results.results.bundleSize.largeImports.length > 0) {
        output += `### ${i18n.t('modules.performance.bundleSize.largeImports.title')}\n\n`;
        results.results.bundleSize.largeImports.forEach(imp => {
          output += `- **${imp.file}**: ${imp.library}\n`;
          output += `  - ${i18n.t('modules.performance.visualize.recommendation')}: ${imp.recommendation}\n\n`;
        });
      } else {
        output += `${i18n.t('modules.performance.bundleSize.largeImports.noLargeImports')}\n\n`;
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
<div class="performance-container">
  <h2>${i18n.t('modules.performance.visualize.title')}</h2>
  
  <!-- Image Optimizasyon -->
  <div class="section">
    <h3>${i18n.t('modules.performance.imageOptimization.title')}</h3>`;
      
      if (results.results.imageOptimization.isFullyOptimized) {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.performance.imageOptimization.fullyOptimized')}</p>
    </div>`;
      } else {
        html += `
    <div class="warning-message">
      <p>⚠️ ${i18n.t('modules.performance.imageOptimization.notFullyOptimized', { 
        totalImages: results.results.imageOptimization.totalImages, 
        nonOptimizedCount: results.results.imageOptimization.nonOptimizedImages.length 
      })}</p>
    </div>
    
    <div class="subsection">
      <h4>${i18n.t('modules.performance.imageOptimization.nonOptimizedImages')}</h4>
      <ul class="issue-list">`;
        
        results.results.imageOptimization.nonOptimizedImages.forEach(image => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${image.file}</div>
          <div class="issue-source">${image.imageSrc}</div>
          <div class="issue-description">${i18n.t('modules.performance.visualize.issue')}: ${image.issue}</div>
          <div class="issue-recommendation">${i18n.t('modules.performance.visualize.recommendation')}: ${image.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      }
      
      // Bundle size sonuçları
      html += `
  </div>
  
  <!-- Bundle Size Analizi -->
  <div class="section">
    <h3>${i18n.t('modules.performance.bundleSize.title')}</h3>`;
      
      // Büyük komponentler
      if (results.results.bundleSize.largeComponents.length > 0) {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.performance.bundleSize.largeComponents.title')}</h4>
      <ul class="issue-list">`;
        
        results.results.bundleSize.largeComponents.forEach(component => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${component.file}</div>
          <div class="issue-size">${(component.size / 1024).toFixed(2)} KB</div>
          <div class="issue-recommendation">${i18n.t('modules.performance.visualize.recommendation')}: ${component.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      } else {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.performance.bundleSize.largeComponents.noLargeComponents')}</p>
    </div>`;
      }
      
      // Büyük kütüphaneler
      if (results.results.bundleSize.largeImports.length > 0) {
        html += `
    <div class="subsection">
      <h4>${i18n.t('modules.performance.bundleSize.largeImports.title')}</h4>
      <ul class="issue-list">`;
        
        results.results.bundleSize.largeImports.forEach(imp => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${imp.file}</div>
          <div class="issue-library">${imp.library}</div>
          <div class="issue-recommendation">${i18n.t('modules.performance.visualize.recommendation')}: ${imp.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      } else {
        html += `
    <div class="success-message">
      <p>✅ ${i18n.t('modules.performance.bundleSize.largeImports.noLargeImports')}</p>
    </div>`;
      }
      
      html += `
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
