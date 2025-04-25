const fs = require('fs-extra');
const path = require('path');
const { findFiles, hasUseClientDirective, extractImports, getRelativePath, logError, logInfo, logSuccess, logWarning, i18n } = require('../utils');

/**
 * Component türleri
 * @enum {string}
 */
const ComponentType = {
  SERVER: 'server',
  CLIENT: 'client'
};

/**
 * Next.js projesi analiz sonuçlarını tutan temel sınıf
 */
class NextJsAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.components = new Map(); // Dosya yolu -> {type, imports, importedBy}
    this.appDir = null;
    this.pagesDir = null;
    this.moduleResults = new Map(); // Modül adı -> analiz sonuçları
  }

  /**
   * Projeyi analiz eder
   */
  async analyze() {
    logInfo(i18n.t('analyzer.messages.analyzing'));
    
    // App ve Pages dizinlerini bul
    this.findNextJsDirs();
    
    if (!this.appDir && !this.pagesDir) {
      logError(i18n.t('analyzer.messages.noNextJsDirs'));
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
      logError(i18n.t('analyzer.messages.noJsFiles'));
      return false;
    }
    
    logSuccess(i18n.t('analyzer.messages.filesFound', { count: files.length }));
    
    // Her dosyayı analiz et
    for (const file of files) {
      this.analyzeFile(file);
    }
    
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
   * Modül analiz sonuçlarını ekler
   * @param {string} moduleName - Modül adı
   * @param {Object} results - Analiz sonuçları
   */
  addModuleResults(moduleName, results) {
    this.moduleResults.set(moduleName, results);
  }

  /**
   * Tüm modül analiz sonuçlarını döndürür
   * @returns {Object} - Tüm modül analiz sonuçları
   */
  getAllModuleResults() {
    const results = {};
    for (const [moduleName, moduleResult] of this.moduleResults.entries()) {
      results[moduleName] = moduleResult;
    }
    return results;
  }

  /**
   * Belirli bir modülün analiz sonuçlarını döndürür
   * @param {string} moduleName - Modül adı
   * @returns {Object|null} - Modül analiz sonuçları veya null
   */
  getModuleResults(moduleName) {
    return this.moduleResults.get(moduleName) || null;
  }
  
  /**
   * Analyzer nesnesinin bir kopyasını oluşturur
   * @returns {NextJsAnalyzer} - Yeni bir analyzer nesnesi
   */
  clone() {
    const clonedAnalyzer = new NextJsAnalyzer(this.projectPath);
    clonedAnalyzer.appDir = this.appDir;
    clonedAnalyzer.pagesDir = this.pagesDir;
    
    // Components Map'ini kopyala
    this.components.forEach((component, filePath) => {
      clonedAnalyzer.components.set(filePath, {
        type: component.type,
        imports: [...component.imports],
        importedBy: [...component.importedBy],
        initialType: component.initialType
      });
    });
    
    // ModuleResults Map'ini kopyala
    this.moduleResults.forEach((result, moduleName) => {
      clonedAnalyzer.moduleResults.set(moduleName, JSON.parse(JSON.stringify(result)));
    });
    
    return clonedAnalyzer;
  }
}

module.exports = NextJsAnalyzer;
