const fs = require('fs-extra');
const path = require('path');
const { logError, i18n } = require('../utils');

/**
 * Modül yöneticisi sınıfı
 */
class ModuleManager {
  constructor() {
    this.modules = new Map();
    this.loadModules();
  }
  
  /**
   * Tüm modülleri yükler
   */
  loadModules() {
    // Modül dizinindeki tüm modülleri yükle
    const modulesDir = path.join(__dirname);
    const moduleFolders = fs.readdirSync(modulesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const folder of moduleFolders) {
      try {
        const modulePath = path.join(modulesDir, folder, 'index.js');
        if (fs.existsSync(modulePath)) {
          const module = require(modulePath);
          this.modules.set(module.name, module);
        }
      } catch (error) {
        logError(i18n.t('analyzer.messages.unexpectedError'), error);
      }
    }
  }
  
  /**
   * Belirli bir modülü döndürür
   * @param {string} name - Modül adı
   * @returns {Object|undefined} - Modül veya undefined
   */
  getModule(name) {
    return this.modules.get(name);
  }
  
  /**
   * Tüm modülleri döndürür
   * @returns {Array<Object>} - Tüm modüller
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }
  
  /**
   * Belirli bir modülü çalıştırır
   * @param {string} moduleName - Modül adı
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Promise<Object>} - Analiz sonuçları
   */
  async runAnalysis(moduleName, analyzer, options) {
    const module = this.getModule(moduleName);
    if (!module) {
      throw new Error(`${moduleName} ${i18n.t('analyzer.messages.analysisFailed')}`);
    }
    
    const results = await module.analyze(analyzer, options);
    analyzer.addModuleResults(moduleName, results);
    return results;
  }
  
  /**
   * Tüm modülleri çalıştırır
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @param {Object} options - Analiz seçenekleri
   * @returns {Promise<Object>} - Tüm analiz sonuçları
   */
  async runAllAnalyses(analyzer, options) {
    const results = {};
    
    for (const [name, module] of this.modules.entries()) {
      try {
        results[name] = await module.analyze(analyzer, options);
        analyzer.addModuleResults(name, results[name]);
      } catch (error) {
        logError(`${name} ${i18n.t('analyzer.messages.unexpectedError')}`, error);
        results[name] = { error: error.message };
      }
    }
    
    return results;
  }
  
  /**
   * Belirli bir modülün sonuçlarını görselleştirir
   * @param {string} moduleName - Modül adı
   * @param {string} format - Görselleştirme formatı (text, html, json)
   * @param {Object} results - Analiz sonuçları
   * @param {NextJsAnalyzer} analyzer - Analyzer instance
   * @returns {string} - Görselleştirilmiş sonuçlar
   */
  visualizeResults(moduleName, format, results, analyzer) {
    const module = this.getModule(moduleName);
    if (!module) {
      throw new Error(`${moduleName} ${i18n.t('analyzer.messages.analysisFailed')}`);
    }
    
    if (!module.visualize || !module.visualize[format]) {
      throw new Error(`${moduleName} ${i18n.t('analyzer.messages.analysisFailed')}`);
    }
    
    return module.visualize[format](results, analyzer);
  }
}

module.exports = new ModuleManager();
