const fs = require('fs-extra');
const path = require('path');
const { getRelativePath, i18n } = require('../../utils');

/**
 * Kod Kalitesi Analiz Modülü
 */
module.exports = {
  name: i18n.t('modules.code-quality.name'),
  description: i18n.t('modules.code-quality.description'),
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Kullanılmayan komponentleri bul
    const unusedComponents = this.findUnusedComponents(analyzer);
    
    return {
      results: {
        unusedComponents
      },
      metadata: {
        totalComponents: analyzer.components.size,
        unusedComponentCount: unusedComponents.length
      }
    };
  },
  
  /**
   * Kullanılmayan komponentleri bulur
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {Array<Object>} - Kullanılmayan komponentler
   */
  findUnusedComponents(analyzer) {
    // Tüm komponentleri ve import edilen komponentleri bul
    const allComponents = new Set(analyzer.components.keys());
    const importedComponents = new Set();
    
    // Import edilen tüm komponentleri topla
    for (const [filePath, component] of analyzer.components.entries()) {
      component.imports.forEach(importPath => {
        if (analyzer.components.has(importPath)) {
          importedComponents.add(importPath);
        }
      });
    }
    
    // Kullanılmayan komponentleri bul (hiçbir yerden import edilmemiş olanlar)
    const unusedComponents = Array.from(allComponents)
      .filter(component => !importedComponents.has(component));
    
    // Sayfa dosyalarını hariç tut (pages/ veya app/ dizinindeki page.js, layout.js, route.js dosyaları)
    const filteredUnusedComponents = unusedComponents.filter(component => {
      const isPageFile = component.includes('/page.') || 
                         component.includes('/layout.') || 
                         component.includes('/route.') ||
                         component.includes('/error.') ||
                         component.includes('/loading.') ||
                         component.includes('/not-found.');
      
      const isInPagesOrAppDir = (analyzer.pagesDir && component.startsWith(analyzer.pagesDir)) ||
                               (analyzer.appDir && component.startsWith(analyzer.appDir));
      
      // Sayfa dosyası ve pages/app dizininde ise, kullanılmayan olarak işaretleme
      return !(isPageFile && isInPagesOrAppDir);
    });
    
    return filteredUnusedComponents.map(component => ({
      path: getRelativePath(component, analyzer.projectPath),
      type: i18n.t('modules.code-quality.types.unused-component')
    }));
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
      let output = `# ${i18n.t('modules.code-quality.visualize.title')}\n\n`;
      
      if (results.results.unusedComponents.length === 0) {
        output += `${i18n.t('modules.code-quality.visualize.noUnusedComponents')}\n`;
      } else {
        results.results.unusedComponents.forEach(component => {
          output += `- ${component.path}\n`;
        });
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
<div class="code-quality-container">
  <h2>${i18n.t('modules.code-quality.visualize.title')}</h2>`;
      
      if (results.results.unusedComponents.length === 0) {
        html += `
  <p>${i18n.t('modules.code-quality.visualize.noUnusedComponents')}</p>`;
      } else {
        html += `
  <ul class="unused-components-list">`;
        
        results.results.unusedComponents.forEach(component => {
          html += `
    <li class="unused-component">
      <span class="file-path">${component.path}</span>
    </li>`;
        });
        
        html += `
  </ul>`;
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
