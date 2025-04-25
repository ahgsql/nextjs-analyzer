const fs = require('fs-extra');
const path = require('path');
const { logError, logSuccess } = require('../utils');
const moduleManager = require('../modules');

/**
 * Görselleştirme yöneticisi
 */
class VisualizerManager {
  constructor() {
    this.formats = ['text', 'html', 'json'];
  }
  
  /**
   * Belirli bir modülün sonuçlarını görselleştirir
   * @param {string} moduleName - Modül adı
   * @param {string} format - Görselleştirme formatı (text, html, json)
   * @param {Object} results - Analiz sonuçları
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {string} - Görselleştirilmiş sonuçlar
   */
  visualize(moduleName, format, results, analyzer) {
    if (!this.formats.includes(format)) {
      throw new Error(`Desteklenmeyen format: ${format}`);
    }
    
    return moduleManager.visualizeResults(moduleName, format, results, analyzer);
  }
  
  /**
   * Tüm modüllerin sonuçlarını birleştirerek görselleştirir
   * @param {string} format - Görselleştirme formatı (text, html, json)
   * @param {Object} allResults - Tüm analiz sonuçları
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {string} - Görselleştirilmiş sonuçlar
   */
  visualizeAll(format, allResults, analyzer) {
    if (format === 'json') {
      return JSON.stringify(allResults, null, 2);
    }
    
    if (format === 'html') {
      return this.generateCombinedHtml(allResults, analyzer);
    }
    
    // Text formatı için
    let output = '';
    for (const [moduleName, results] of Object.entries(allResults)) {
      const module = moduleManager.getModule(moduleName);
      if (module && module.visualize && module.visualize.text) {
        output += `\n# ${module.description}\n\n`;
        output += module.visualize.text(results, analyzer);
        output += '\n\n';
      }
    }
    
    return output;
  }
  
  /**
   * Tüm modüllerin sonuçlarını birleştirerek HTML formatında görselleştirir
   * @param {Object} allResults - Tüm analiz sonuçları
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {string} - HTML formatında görselleştirilmiş sonuçlar
   */
  generateCombinedHtml(allResults, analyzer) {
    const htmlHeader = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Next.js Analiz Sonuçları</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #0070f3;
      text-align: center;
      margin-bottom: 30px;
    }
    h2 {
      color: #0070f3;
      border-bottom: 1px solid #eaeaea;
      padding-bottom: 10px;
      margin-top: 40px;
    }
    .module-container {
      margin-bottom: 40px;
      padding: 20px;
      border-radius: 8px;
      background-color: #f9f9f9;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .module-title {
      font-size: 1.5em;
      margin-bottom: 15px;
      color: #0070f3;
    }
    .module-description {
      font-style: italic;
      margin-bottom: 20px;
      color: #666;
    }
    .module-content {
      margin-top: 20px;
    }
    .tabs {
      display: flex;
      margin-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      border-bottom: none;
      margin-right: 5px;
      border-radius: 5px 5px 0 0;
    }
    .tab.active {
      background-color: #0070f3;
      color: white;
      border-color: #0070f3;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .metadata {
      background-color: #f0f8ff;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .metadata-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .metadata-item {
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <h1>Next.js Analiz Sonuçları</h1>
  <div class="tabs">
    ${Object.keys(allResults).map((moduleName, index) => 
      `<div class="tab${index === 0 ? ' active' : ''}" onclick="openTab(event, '${moduleName}')">${moduleName}</div>`
    ).join('')}
  </div>`;

    let htmlContent = '';
    
    Object.entries(allResults).forEach(([moduleName, results], index) => {
      const module = moduleManager.getModule(moduleName);
      if (!module) return;
      
      htmlContent += `
  <div id="${moduleName}" class="tab-content${index === 0 ? ' active' : ''}">
    <div class="module-container">
      <div class="module-title">${moduleName}</div>
      <div class="module-description">${module.description}</div>`;
      
      // Metadata göster
      if (results.metadata) {
        htmlContent += `
      <div class="metadata">
        <div class="metadata-title">Metadata:</div>`;
        
        Object.entries(results.metadata).forEach(([key, value]) => {
          htmlContent += `
        <div class="metadata-item"><strong>${key}:</strong> ${value}</div>`;
        });
        
        htmlContent += `
      </div>`;
      }
      
      // Modül içeriğini göster
      if (module.visualize && module.visualize.html) {
        try {
          const moduleHtml = module.visualize.html(results, analyzer);
          htmlContent += `
      <div class="module-content">
        ${moduleHtml}
      </div>`;
        } catch (error) {
          htmlContent += `
      <div class="module-content">
        <p style="color: red;">Hata: ${error.message}</p>
      </div>`;
        }
      }
      
      htmlContent += `
    </div>
  </div>`;
    });

    const htmlFooter = `
  <script>
    function openTab(evt, tabName) {
      var i, tabcontent, tablinks;
      
      // Tüm tab içeriklerini gizle
      tabcontent = document.getElementsByClassName("tab-content");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
      
      // Tüm tabların aktif sınıfını kaldır
      tablinks = document.getElementsByClassName("tab");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
      
      // Tıklanan tabı göster ve aktif sınıfını ekle
      document.getElementById(tabName).style.display = "block";
      evt.currentTarget.className += " active";
    }
  </script>
</body>
</html>`;

    return htmlHeader + htmlContent + htmlFooter;
  }
  
  /**
   * Analiz sonuçlarını dosyaya kaydeder
   * @param {string} outputPath - Çıktı dosyasının yolu
   * @param {string} format - Çıktı formatı (text, html, json)
   * @param {string} content - Kaydedilecek içerik
   */
  saveToFile(outputPath, format, content) {
    try {
      // Format parametresine göre çıktı dosyasının uzantısını otomatik olarak değiştir
      if (format === 'json' && !outputPath.toLowerCase().endsWith('.json')) {
        outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.json';
      } else if (format === 'html' && !outputPath.toLowerCase().endsWith('.html')) {
        outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.html';
      } else if (format === 'text' && !outputPath.toLowerCase().endsWith('.txt')) {
        outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.txt';
      }
      
      fs.writeFileSync(outputPath, content);
      logSuccess(`Analiz sonuçları ${outputPath} dosyasına kaydedildi.`);
    } catch (error) {
      logError(`Hata: Analiz sonuçları kaydedilemedi.`, error);
    }
  }
}

module.exports = new VisualizerManager();
