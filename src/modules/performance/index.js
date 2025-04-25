const fs = require('fs-extra');
const path = require('path');
const { findFiles, getRelativePath } = require('../../utils');

/**
 * Performans Analizi Modülü
 */
module.exports = {
  name: 'performance',
  description: 'Next.js projelerinde performans analizi yapar',
  
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
              issue: 'Next.js Image komponenti kullanılmıyor',
              recommendation: 'next/image import edip, <Image> komponenti kullanın'
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
              issue: 'Image komponentinde width ve/veya height belirtilmemiş',
              recommendation: 'CLS (Cumulative Layout Shift) sorunlarını önlemek için width ve height belirtin'
            });
          }
          
          // priority attribute'unu kontrol et (LCP için)
          if (content.includes('hero') || content.includes('banner') || content.includes('carousel')) {
            const hasPriority = /<Image\s+[^>]*priority\s*[=\s>]/.test(content);
            
            if (!hasPriority) {
              nonOptimizedImages.push({
                file: getRelativePath(filePath, analyzer.projectPath),
                imageSrc: match[1],
                issue: 'Hero/banner görüntüsü için priority attribute\'u kullanılmamış',
                recommendation: 'LCP (Largest Contentful Paint) metriğini iyileştirmek için hero görüntülerine priority ekleyin'
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
            recommendation: 'Komponenti daha küçük parçalara bölmeyi düşünün'
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
      'lodash': 'Sadece ihtiyaç duyulan fonksiyonları import edin: import { debounce } from "lodash/debounce"',
      'moment': 'date-fns veya day.js gibi daha hafif alternatifleri kullanın',
      'chart.js': 'Sadece ihtiyaç duyulan chart türlerini import edin',
      'three.js': 'Dynamic import ile lazy loading yapın',
      'monaco-editor': 'Dynamic import ile lazy loading yapın',
      'draft-js': 'Dynamic import ile lazy loading yapın',
      'quill': 'Dynamic import ile lazy loading yapın',
      'react-bootstrap': 'Sadece ihtiyaç duyulan komponentleri import edin',
      'material-ui': '@mui/material\'in tree-shakeable versiyonunu kullanın',
      '@material-ui/core': 'Sadece ihtiyaç duyulan komponentleri import edin',
      '@mui/material': 'Sadece ihtiyaç duyulan komponentleri import edin'
    };
    
    return recommendations[library] || 'Dynamic import ile lazy loading yapın';
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
      let output = '# Performans Analizi\n\n';
      
      // Image optimizasyon sonuçları
      output += '## Image Optimizasyon\n\n';
      
      if (results.results.imageOptimization.isFullyOptimized) {
        output += 'Tüm görüntüler optimize edilmiş. Harika!\n\n';
      } else {
        output += `Toplam ${results.results.imageOptimization.totalImages} görüntüden ${results.results.imageOptimization.nonOptimizedImages.length} tanesi optimize edilmemiş.\n\n`;
        
        output += '### Optimize Edilmemiş Görüntüler\n\n';
        results.results.imageOptimization.nonOptimizedImages.forEach(image => {
          output += `- **${image.file}**: ${image.imageSrc}\n`;
          output += `  - Sorun: ${image.issue}\n`;
          output += `  - Öneri: ${image.recommendation}\n\n`;
        });
      }
      
      // Bundle size sonuçları
      output += '## Bundle Size Analizi\n\n';
      
      // Büyük komponentler
      if (results.results.bundleSize.largeComponents.length > 0) {
        output += '### Büyük Komponentler\n\n';
        results.results.bundleSize.largeComponents.forEach(component => {
          output += `- **${component.file}**: ${(component.size / 1024).toFixed(2)} KB\n`;
          output += `  - Öneri: ${component.recommendation}\n\n`;
        });
      } else {
        output += 'Büyük komponent tespit edilmedi. Harika!\n\n';
      }
      
      // Büyük kütüphaneler
      if (results.results.bundleSize.largeImports.length > 0) {
        output += '### Büyük Kütüphaneler\n\n';
        results.results.bundleSize.largeImports.forEach(imp => {
          output += `- **${imp.file}**: ${imp.library}\n`;
          output += `  - Öneri: ${imp.recommendation}\n\n`;
        });
      } else {
        output += 'Büyük kütüphane import\'u tespit edilmedi. Harika!\n\n';
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
  <h2>Performans Analizi</h2>
  
  <!-- Image Optimizasyon -->
  <div class="section">
    <h3>Image Optimizasyon</h3>`;
      
      if (results.results.imageOptimization.isFullyOptimized) {
        html += `
    <div class="success-message">
      <p>✅ Tüm görüntüler optimize edilmiş. Harika!</p>
    </div>`;
      } else {
        html += `
    <div class="warning-message">
      <p>⚠️ Toplam ${results.results.imageOptimization.totalImages} görüntüden ${results.results.imageOptimization.nonOptimizedImages.length} tanesi optimize edilmemiş.</p>
    </div>
    
    <div class="subsection">
      <h4>Optimize Edilmemiş Görüntüler</h4>
      <ul class="issue-list">`;
        
        results.results.imageOptimization.nonOptimizedImages.forEach(image => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${image.file}</div>
          <div class="issue-source">${image.imageSrc}</div>
          <div class="issue-description">Sorun: ${image.issue}</div>
          <div class="issue-recommendation">Öneri: ${image.recommendation}</div>
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
    <h3>Bundle Size Analizi</h3>`;
      
      // Büyük komponentler
      if (results.results.bundleSize.largeComponents.length > 0) {
        html += `
    <div class="subsection">
      <h4>Büyük Komponentler</h4>
      <ul class="issue-list">`;
        
        results.results.bundleSize.largeComponents.forEach(component => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${component.file}</div>
          <div class="issue-size">${(component.size / 1024).toFixed(2)} KB</div>
          <div class="issue-recommendation">Öneri: ${component.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      } else {
        html += `
    <div class="success-message">
      <p>✅ Büyük komponent tespit edilmedi. Harika!</p>
    </div>`;
      }
      
      // Büyük kütüphaneler
      if (results.results.bundleSize.largeImports.length > 0) {
        html += `
    <div class="subsection">
      <h4>Büyük Kütüphaneler</h4>
      <ul class="issue-list">`;
        
        results.results.bundleSize.largeImports.forEach(imp => {
          html += `
        <li class="issue-item">
          <div class="issue-file">${imp.file}</div>
          <div class="issue-library">${imp.library}</div>
          <div class="issue-recommendation">Öneri: ${imp.recommendation}</div>
        </li>`;
        });
        
        html += `
      </ul>
    </div>`;
      } else {
        html += `
    <div class="success-message">
      <p>✅ Büyük kütüphane import'u tespit edilmedi. Harika!</p>
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
