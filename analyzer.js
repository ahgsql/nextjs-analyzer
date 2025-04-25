const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { findFiles, hasUseClientDirective, extractImports, getRelativePath } = require('./utils');

/**
 * Component türleri
 * @enum {string}
 */
const ComponentType = {
  SERVER: 'server',
  CLIENT: 'client'
};

/**
 * Next.js projesi analiz sonuçlarını tutan sınıf
 */
class NextJsAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.components = new Map(); // Dosya yolu -> {type, imports, importedBy}
    this.appDir = null;
    this.pagesDir = null;
  }

  /**
   * Projeyi analiz eder
   */
  async analyze() {
    console.log(chalk.blue('Next.js projesi analiz ediliyor...'));
    
    // App ve Pages dizinlerini bul
    this.findNextJsDirs();
    
    if (!this.appDir && !this.pagesDir) {
      console.error(chalk.red('Hata: Next.js app veya pages dizini bulunamadı.'));
      return false;
    }
    
    // Tüm JavaScript/TypeScript dosyalarını bul
    const files = [];
    if (this.appDir) {
      files.push(...findFiles(this.appDir));
    }
    if (this.pagesDir) {
      files.push(...findFiles(this.pagesDir));
    }
    
    if (files.length === 0) {
      console.error(chalk.red('Hata: Hiç JavaScript/TypeScript dosyası bulunamadı.'));
      return false;
    }
    
    console.log(chalk.green(`${files.length} dosya bulundu.`));
    
    // Her dosyayı analiz et
    for (const file of files) {
      this.analyzeFile(file);
    }
    
    // Component türlerini belirle
    this.determineComponentTypes();
    
    return true;
  }

  /**
   * Next.js app ve pages dizinlerini bulur
   */
  findNextJsDirs() {
    // src/app veya app dizinini ara
    const possibleAppDirs = [
      path.join(this.projectPath, 'src', 'app'),
      path.join(this.projectPath, 'app')
    ];
    
    for (const dir of possibleAppDirs) {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.appDir = dir;
        break;
      }
    }
    
    // src/pages veya pages dizinini ara
    const possiblePagesDirs = [
      path.join(this.projectPath, 'src', 'pages'),
      path.join(this.projectPath, 'pages')
    ];
    
    for (const dir of possiblePagesDirs) {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.pagesDir = dir;
        break;
      }
    }
  }

  /**
   * Tek bir dosyayı analiz eder
   * @param {string} filePath - Analiz edilecek dosya yolu
   */
  analyzeFile(filePath) {
    const isClientComponent = hasUseClientDirective(filePath);
    const imports = extractImports(filePath);
    
    this.components.set(filePath, {
      type: isClientComponent ? ComponentType.CLIENT : ComponentType.SERVER,
      imports: imports.filter(imp => imp.path !== null).map(imp => imp.path),
      importedBy: [],
      initialType: isClientComponent ? ComponentType.CLIENT : ComponentType.SERVER
    });
    
    // Import edilen dosyaların importedBy listesini güncelle
    imports.forEach(imp => {
      if (imp.path) {
        if (!this.components.has(imp.path)) {
          this.components.set(imp.path, {
            type: null, // Henüz bilinmiyor
            imports: [],
            importedBy: [filePath],
            initialType: null
          });
        } else {
          this.components.get(imp.path).importedBy.push(filePath);
        }
      }
    });
  }

  /**
   * Tüm componentlerin türlerini belirler
   */
  determineComponentTypes() {
    let changed = true;
    
    // Tüm component türleri sabitlenene kadar devam et
    while (changed) {
      changed = false;
      
      for (const [filePath, component] of this.components.entries()) {
        // Eğer component türü zaten CLIENT ise, değişiklik yapma
        if (component.type === ComponentType.CLIENT) {
          continue;
        }
        
        // Eğer bu component bir CLIENT component tarafından import edilmişse,
        // bu component de CLIENT olmalıdır
        const isImportedByClient = component.importedBy.some(importerPath => {
          const importer = this.components.get(importerPath);
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
  }

  /**
   * Analiz sonuçlarını tree-view formatında döndürür
   * @returns {string} - Tree-view formatında analiz sonuçları
   */
  generateTreeView() {
    // Önce app dizinini analiz et
    let result = '';
    
    if (this.appDir) {
      result += this.generateDirTreeView(this.appDir, 'app');
    }
    
    // Sonra pages dizinini analiz et
    if (this.pagesDir) {
      if (result) result += '\n\n';
      result += this.generateDirTreeView(this.pagesDir, 'pages');
    }
    
    return result;
  }

  /**
   * Belirli bir dizin için tree-view oluşturur
   * @param {string} dir - Dizin yolu
   * @param {string} dirName - Dizin adı
   * @returns {string} - Tree-view formatında dizin analizi
   */
  generateDirTreeView(dir, dirName) {
    const rootFiles = this.findRootFiles(dir);
    
    let result = chalk.blue(`[DIR] ${dirName}/\n`);

    // Her bir kök dosya için ağaç oluştur
    rootFiles.forEach((file, index) => {
      const isLast = index === rootFiles.length - 1;
      const prefix = isLast ? '└── ' : '├── ';
      result += this.generateFileTreeView(file, prefix, isLast ? '    ' : '│   ');
    });
    
    return result;
  }

  /**
   * Bir dizindeki kök dosyaları bulur (başka dosyalar tarafından import edilmeyen)
   * @param {string} dir - Dizin yolu
   * @returns {Array<string>} - Kök dosyaların yolları
   */
  findRootFiles(dir) {
    // Dizindeki tüm dosyaları bul
    const dirFiles = Array.from(this.components.keys())
      .filter(filePath => filePath.startsWith(dir));
    
    // Başka dosyalar tarafından import edilmeyen dosyaları bul
    return dirFiles.filter(filePath => {
      const component = this.components.get(filePath);
      // Hiç import edilmemiş veya sadece dizin dışından import edilmiş
      return component.importedBy.length === 0 || 
             !component.importedBy.some(importerPath => importerPath.startsWith(dir));
    });
  }

  /**
   * Bir dosya için tree-view oluşturur
   * @param {string} filePath - Dosya yolu
   * @param {string} prefix - Ağaç öneki
   * @param {string} childPrefix - Alt dosyalar için ağaç öneki
   * @returns {string} - Tree-view formatında dosya analizi
   */
  generateFileTreeView(filePath, prefix, childPrefix) {
    const component = this.components.get(filePath);
    const fileName = path.basename(filePath);
    const relPath = getRelativePath(filePath, this.projectPath);
    
    // Dosya türüne göre renk belirle
    const typeColor = component.type === ComponentType.CLIENT ? chalk.yellow : chalk.green;
    const typeText = component.type === ComponentType.CLIENT ? 'Client Component' : 'Server Component';
    
    // Göreceli yolu oluştur (src/ kısmını kaldır)
    let displayPath = relPath;
    if (displayPath.startsWith('src/')) {
      displayPath = displayPath.substring(4);
    }
    
    // Dosya satırını oluştur
    let result = `${prefix}[FILE] ${displayPath} (${typeColor(typeText)})\n`;
    
    // Bu dosyanın import ettiği ve aynı projede olan dosyaları bul
    const imports = component.imports
      .filter(importPath => this.components.has(importPath))
      .sort();
    
    // Her bir import için alt ağaç oluştur
    imports.forEach((importPath, index) => {
      const isLast = index === imports.length - 1;
      const importPrefix = childPrefix + (isLast ? '└── ' : '├── ');
      const importChildPrefix = childPrefix + (isLast ? '    ' : '│   ');
      
      result += this.generateFileTreeView(importPath, importPrefix, importChildPrefix);
    });
    
    return result;
  }

  /**
   * Analiz sonuçlarını JSON formatında döndürür
   * @returns {Object} - JSON formatında analiz sonuçları
   */
  generateJsonOutput() {
    const result = {
      appComponents: [],
      pagesComponents: [],
      otherComponents: []
    };
    
    for (const [filePath, component] of this.components.entries()) {
      const componentInfo = {
        path: getRelativePath(filePath, this.projectPath),
        type: component.type,
        initialType: component.initialType,
        imports: component.imports.map(imp => getRelativePath(imp, this.projectPath)),
        importedBy: component.importedBy.map(imp => getRelativePath(imp, this.projectPath))
      };
      
      if (this.appDir && filePath.startsWith(this.appDir)) {
        result.appComponents.push(componentInfo);
      } else if (this.pagesDir && filePath.startsWith(this.pagesDir)) {
        result.pagesComponents.push(componentInfo);
      } else {
        result.otherComponents.push(componentInfo);
      }
    }
    
    return result;
  }

  /**
   * Analiz sonuçlarını HTML formatında döndürür
   * @returns {string} - HTML formatında analiz sonuçları
   */
  generateHtmlOutput() {
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
    if (this.appDir) {
      htmlContent += this.generateDirHtml(this.appDir, 'app');
    }

    // Pages dizini için HTML oluştur
    if (this.pagesDir) {
      htmlContent += this.generateDirHtml(this.pagesDir, 'pages');
    }

    return htmlHeader + htmlContent + htmlFooter;
  }

  /**
   * Belirli bir dizin için HTML oluşturur
   * @param {string} dir - Dizin yolu
   * @param {string} dirName - Dizin adı
   * @returns {string} - HTML formatında dizin analizi
   */
  generateDirHtml(dir, dirName) {
    const rootFiles = this.findRootFiles(dir);
    
    let result = `
  <div class="tree-container">
    <h2>📁 ${dirName}/</h2>
    <div class="tree">`;
    
    // Her bir kök dosya için ağaç oluştur
    rootFiles.forEach(file => {
      result += this.generateFileHtml(file, 0);
    });
    
    result += `
    </div>
  </div>`;
    
    return result;
  }

  /**
   * Bir dosya için HTML oluşturur
   * @param {string} filePath - Dosya yolu
   * @param {number} level - İç içe geçme seviyesi
   * @returns {string} - HTML formatında dosya analizi
   */
  generateFileHtml(filePath, level) {
    const component = this.components.get(filePath);
    const fileName = path.basename(filePath);
    const relPath = getRelativePath(filePath, this.projectPath);
    
    // Dosya türüne göre sınıf belirle
    const typeClass = component.type === ComponentType.CLIENT ? 'client' : 'server';
    const typeText = component.type === ComponentType.CLIENT ? 'Client Component' : 'Server Component';
    
    // Göreceli yolu oluştur (src/ kısmını kaldır)
    let displayPath = relPath;
    if (displayPath.startsWith('src/')) {
      displayPath = displayPath.substring(4);
    }
    
    // Bu dosyanın import ettiği ve aynı projede olan dosyaları bul
    const imports = component.imports
      .filter(importPath => this.components.has(importPath))
      .sort();
    
    // Bu dosyayı import eden dosyaları bul
    const importedBy = component.importedBy
      .filter(importPath => this.components.has(importPath))
      .map(importPath => getRelativePath(importPath, this.projectPath))
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
          const importRelPath = getRelativePath(importPath, this.projectPath);
          let importDisplayPath = importRelPath;
          if (importDisplayPath.startsWith('src/')) {
            importDisplayPath = importDisplayPath.substring(4);
          }
          
          const importType = this.components.get(importPath).type;
          const importTypeClass = importType === ComponentType.CLIENT ? 'client' : 'server';
          const importTypeText = importType === ComponentType.CLIENT ? 'Client Component' : 'Server Component';
          
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
        result += this.generateFileHtml(importPath, level + 1);
      });
      
      result += `
          </div>`;
    }
    
    result += `
        </div>
      </div>`;
    
    return result;
  }

  /**
   * Analiz sonuçlarını dosyaya kaydeder
   * @param {string} outputPath - Çıktı dosyasının yolu
   * @param {string} format - Çıktı formatı ('json', 'text' veya 'html')
   */
  saveToFile(outputPath, format = 'text') {
    try {
      let content;
      
      if (format === 'json') {
        content = JSON.stringify(this.generateJsonOutput(), null, 2);
      } else if (format === 'html') {
        content = this.generateHtmlOutput();
      } else {
        // ANSI renk kodlarını kaldır
        const stripAnsi = (str) => {
          return str.replace(/\x1B\[\d+m/g, '');
        };
        
        // Tree view oluştur ve ANSI kodlarını kaldır
        const treeView = this.generateTreeView();
        content = stripAnsi(treeView);
        
        // Konsol çıktısındaki ASCII karakterleri emoji karakterleriyle değiştir
        content = content.replace(/\[DIR\]/g, '📁');
        content = content.replace(/\[FILE\]/g, '📄');
      }
      
      fs.writeFileSync(outputPath, content);
      console.log(chalk.green(`Analiz sonuçları ${outputPath} dosyasına kaydedildi.`));
    } catch (error) {
      console.error(chalk.red(`Hata: Analiz sonuçları kaydedilemedi.`), error);
    }
  }
}

module.exports = NextJsAnalyzer;
