const path = require('path');
const chalk = require('chalk');
const { getRelativePath, stripAnsi, replaceAsciiWithEmoji, i18n } = require('../../utils');

/**
 * Component türleri
 * @enum {string}
 */
const ComponentType = {
  SERVER: 'server',
  CLIENT: 'client'
};

/**
 * Client-Server Component analiz modülü
 */
module.exports = {
  name: i18n.t('modules.component.name'),
  description: i18n.t('modules.component.description'),
  
  /**
   * Analiz işlemini gerçekleştirir
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Object} - Analiz sonuçları
   */
  async analyze(analyzer, options) {
    // Component türlerini belirle
    this.determineComponentTypes(analyzer);
    
    return {
      results: {
        components: Array.from(analyzer.components.entries()).map(([filePath, component]) => ({
          path: getRelativePath(filePath, analyzer.projectPath),
          type: component.type,
          initialType: component.initialType,
          imports: component.imports.map(imp => getRelativePath(imp, analyzer.projectPath)),
          importedBy: component.importedBy.map(imp => getRelativePath(imp, analyzer.projectPath))
        }))
      },
      metadata: {
        totalComponents: analyzer.components.size,
        serverComponents: Array.from(analyzer.components.values()).filter(c => c.type === ComponentType.SERVER).length,
        clientComponents: Array.from(analyzer.components.values()).filter(c => c.type === ComponentType.CLIENT).length
      }
    };
  },
  
  /**
   * Tüm componentlerin türlerini belirler
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   */
  determineComponentTypes(analyzer) {
    let changed = true;
    
    // Tüm component türleri sabitlenene kadar devam et
    while (changed) {
      changed = false;
      
      for (const [filePath, component] of analyzer.components.entries()) {
        // Eğer component türü zaten CLIENT ise, değişiklik yapma
        if (component.type === ComponentType.CLIENT) {
          continue;
        }
        
        // Eğer bu component bir CLIENT component tarafından import edilmişse,
        // bu component de CLIENT olmalıdır
        const isImportedByClient = component.importedBy.some(importerPath => {
          const importer = analyzer.components.get(importerPath);
          return importer && importer.type === ComponentType.CLIENT;
        });
        
        if (isImportedByClient && component.type !== ComponentType.CLIENT) {
          component.type = ComponentType.CLIENT;
          changed = true;
        }
        
        // Eğer component türü hala null ise, varsayılan olarak SERVER olarak işaretle
        if (component.type === null) {
          component.type = ComponentType.SERVER;
          changed = true;
        }
      }
    }
  },
  
  /**
   * Görselleştirme fonksiyonları
   */
  visualize: {
    /**
     * Metin formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @param {NextJsAnalyzer} analyzer - Analyzer instance
     * @returns {string} - Metin formatında görselleştirme
     */
    text(results, analyzer) {
      // Önce app dizinini analiz et
      let output = '';
      
      if (analyzer.appDir) {
        output += this.generateDirTreeView(analyzer.appDir, 'app', analyzer);
      }
      
      // Sonra pages dizinini analiz et
      if (analyzer.pagesDir) {
        if (output) output += '\n\n';
        output += this.generateDirTreeView(analyzer.pagesDir, 'pages', analyzer);
      }
      
      // ANSI renk kodlarını kaldır ve emoji ekle
      output = stripAnsi(output);
      output = replaceAsciiWithEmoji(output);
      
      return output;
    },
    
    /**
     * HTML formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @param {NextJsAnalyzer} analyzer - Analyzer instance
     * @returns {string} - HTML formatında görselleştirme
     */
    html(results, analyzer) {
      const htmlHeader = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Next.js Component Analizi</title>
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
    .tree {
      margin-left: 20px;
    }
    .tree-item {
      margin: 5px 0;
    }
    .tree-container {
      margin-bottom: 40px;
    }
    .client {
      color: #ff6b6b;
      font-weight: bold;
    }
    .server {
      color: #38b000;
      font-weight: bold;
    }
    .file-name {
      font-weight: bold;
    }
    .imports-container {
      margin-top: 5px;
      margin-left: 20px;
      font-size: 0.9em;
      color: #666;
    }
    .imports-title {
      font-weight: bold;
      margin-top: 5px;
    }
    .imports-list {
      margin: 0;
      padding-left: 20px;
    }
    .collapsible {
      cursor: pointer;
      user-select: none;
    }
    .collapsible::before {
      content: '▶';
      display: inline-block;
      margin-right: 5px;
      transition: transform 0.3s;
    }
    .active::before {
      transform: rotate(90deg);
    }
    .content {
      display: none;
      overflow: hidden;
    }
    .show {
      display: block;
    }
  </style>
</head>
<body>
  <h1>Next.js Component Analizi</h1>`;

      const htmlFooter = `
  <script>
    // Collapsible sections
    const coll = document.getElementsByClassName("collapsible");
    for (let i = 0; i < coll.length; i++) {
      coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        const content = this.nextElementSibling;
        if (content.style.display === "block") {
          content.style.display = "none";
        } else {
          content.style.display = "block";
        }
      });
    }
  </script>
</body>
</html>`;

      let htmlContent = '';

      // App dizini için HTML oluştur
      if (analyzer.appDir) {
        htmlContent += this.generateDirHtml(analyzer.appDir, 'app', analyzer);
      }

      // Pages dizini için HTML oluştur
      if (analyzer.pagesDir) {
        htmlContent += this.generateDirHtml(analyzer.pagesDir, 'pages', analyzer);
      }

      return htmlHeader + htmlContent + htmlFooter;
    },
    
    /**
     * JSON formatında görselleştirme
     * @param {Object} results - Analiz sonuçları
     * @returns {string} - JSON formatında görselleştirme
     */
    json(results) {
      return JSON.stringify(results, null, 2);
    },
    
    /**
     * Belirli bir dizin için tree-view oluşturur
     * @param {string} dir - Dizin yolu
     * @param {string} dirName - Dizin adı
     * @param {NextJsAnalyzer} analyzer - Analyzer instance
     * @returns {string} - Tree-view formatında dizin analizi
     */
    generateDirTreeView(dir, dirName, analyzer) {
      const rootFiles = this.findRootFiles(dir, analyzer);
      
      let result = chalk.blue(`[DIR] ${dirName}/\n`);

      // Her bir kök dosya için ağaç oluştur
      rootFiles.forEach((file, index) => {
        const isLast = index === rootFiles.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        result += this.generateFileTreeView(file, prefix, isLast ? '    ' : '│   ', analyzer);
      });
      
      return result;
    },
    
    /**
     * Bir dizindeki kök dosyaları bulur (başka dosyalar tarafından import edilmeyen)
     * @param {string} dir - Dizin yolu
     * @param {NextJsAnalyzer} analyzer - Analyzer instance
     * @returns {Array<string>} - Kök dosyaların yolları
     */
    findRootFiles(dir, analyzer) {
      // Dizindeki tüm dosyaları bul
      const dirFiles = Array.from(analyzer.components.keys())
        .filter(filePath => filePath.startsWith(dir));
      
      // Başka dosyalar tarafından import edilmeyen dosyaları bul
      return dirFiles.filter(filePath => {
        const component = analyzer.components.get(filePath);
        // Hiç import edilmemiş veya sadece dizin dışından import edilmiş
        return component.importedBy.length === 0 || 
               !component.importedBy.some(importerPath => importerPath.startsWith(dir));
      });
    },
    
    /**
     * Bir dosya için tree-view oluşturur
     * @param {string} filePath - Dosya yolu
     * @param {string} prefix - Ağaç öneki
     * @param {string} childPrefix - Alt dosyalar için ağaç öneki
     * @param {NextJsAnalyzer} analyzer - Analyzer instance
     * @returns {string} - Tree-view formatında dosya analizi
     */
    generateFileTreeView(filePath, prefix, childPrefix, analyzer) {
      const component = analyzer.components.get(filePath);
      const fileName = path.basename(filePath);
      const relPath = getRelativePath(filePath, analyzer.projectPath);
      
      // Dosya türüne göre renk belirle
      const typeColor = component.type === ComponentType.CLIENT ? chalk.yellow : chalk.green;
      const typeText = component.type === ComponentType.CLIENT ? 
        i18n.t('modules.component.types.client') : 
        i18n.t('modules.component.types.server');
      
      // Göreceli yolu oluştur (src/ kısmını kaldır)
      let displayPath = relPath;
      if (displayPath.startsWith('src/')) {
        displayPath = displayPath.substring(4);
      }
      
      // Dosya satırını oluştur
      let result = `${prefix}[FILE] ${displayPath} (${typeColor(typeText)})\n`;
      
      // Bu dosyanın import ettiği ve aynı projede olan dosyaları bul
      const imports = component.imports
        .filter(importPath => analyzer.components.has(importPath))
        .sort();
      
      // Her bir import için alt ağaç oluştur
      imports.forEach((importPath, index) => {
        const isLast = index === imports.length - 1;
        const importPrefix = childPrefix + (isLast ? '└── ' : '├── ');
        const importChildPrefix = childPrefix + (isLast ? '    ' : '│   ');
        
        result += this.generateFileTreeView(importPath, importPrefix, importChildPrefix, analyzer);
      });
      
      return result;
    },
    
    /**
     * Belirli bir dizin için HTML oluşturur
     * @param {string} dir - Dizin yolu
     * @param {string} dirName - Dizin adı
     * @param {NextJsAnalyzer} analyzer - Analyzer instance
     * @returns {string} - HTML formatında dizin analizi
     */
    generateDirHtml(dir, dirName, analyzer) {
      const rootFiles = this.findRootFiles(dir, analyzer);
      
      let result = `
  <div class="tree-container">
    <h2>📁 ${dirName}/</h2>
    <div class="tree">`;
      
      // Her bir kök dosya için ağaç oluştur
      rootFiles.forEach(file => {
        result += this.generateFileHtml(file, 0, analyzer);
      });
      
      result += `
    </div>
  </div>`;
      
      return result;
    },
    
    /**
     * Bir dosya için HTML oluşturur
     * @param {string} filePath - Dosya yolu
     * @param {number} level - İç içe geçme seviyesi
     * @param {NextJsAnalyzer} analyzer - Analyzer instance
     * @returns {string} - HTML formatında dosya analizi
     */
    generateFileHtml(filePath, level, analyzer) {
      const component = analyzer.components.get(filePath);
      const fileName = path.basename(filePath);
      const relPath = getRelativePath(filePath, analyzer.projectPath);
      
      // Dosya türüne göre sınıf belirle
      const typeClass = component.type === ComponentType.CLIENT ? 'client' : 'server';
      const typeText = component.type === ComponentType.CLIENT ? 
        i18n.t('modules.component.types.client') : 
        i18n.t('modules.component.types.server');
      
      // Göreceli yolu oluştur (src/ kısmını kaldır)
      let displayPath = relPath;
      if (displayPath.startsWith('src/')) {
        displayPath = displayPath.substring(4);
      }
      
      // Bu dosyanın import ettiği ve aynı projede olan dosyaları bul
      const imports = component.imports
        .filter(importPath => analyzer.components.has(importPath))
        .sort();
      
      // Bu dosyayı import eden dosyaları bul
      const importedBy = component.importedBy
        .filter(importPath => analyzer.components.has(importPath))
        .map(importPath => getRelativePath(importPath, analyzer.projectPath))
        .sort();
      
      // Dosya satırını oluştur
      let result = `
      <div class="tree-item">
        <span class="collapsible file-name">📄 ${displayPath} (<span class="${typeClass}">${typeText}</span>)</span>
        <div class="content">`;
      
      // Import ve importedBy bilgilerini ekle
      if (imports.length > 0 || importedBy.length > 0) {
        result += `
          <div class="imports-container">`;
        
        if (imports.length > 0) {
          result += `
            <div class="imports-title">Imports:</div>
            <ul class="imports-list">`;
          
          imports.forEach(importPath => {
            const importRelPath = getRelativePath(importPath, analyzer.projectPath);
            let importDisplayPath = importRelPath;
            if (importDisplayPath.startsWith('src/')) {
              importDisplayPath = importDisplayPath.substring(4);
            }
            
            const importType = analyzer.components.get(importPath).type;
            const importTypeClass = importType === ComponentType.CLIENT ? 'client' : 'server';
            const importTypeText = importType === ComponentType.CLIENT ? 
              i18n.t('modules.component.types.client') : 
              i18n.t('modules.component.types.server');
            
            result += `
              <li>${importDisplayPath} (<span class="${importTypeClass}">${importTypeText}</span>)</li>`;
          });
          
          result += `
            </ul>`;
        }
        
        if (importedBy.length > 0) {
          result += `
            <div class="imports-title">Imported By:</div>
            <ul class="imports-list">`;
          
          importedBy.forEach(importerPath => {
            let importerDisplayPath = importerPath;
            if (importerDisplayPath.startsWith('src/')) {
              importerDisplayPath = importerDisplayPath.substring(4);
            }
            
            result += `
              <li>${importerDisplayPath}</li>`;
          });
          
          result += `
            </ul>`;
        }
        
        result += `
          </div>`;
      }
      
      // Alt dosyaları ekle
      if (imports.length > 0) {
        result += `
          <div class="tree">`;
        
        imports.forEach(importPath => {
          result += this.generateFileHtml(importPath, level + 1, analyzer);
        });
        
        result += `
          </div>`;
      }
      
      result += `
        </div>
      </div>`;
      
      return result;
    }
  }
};
