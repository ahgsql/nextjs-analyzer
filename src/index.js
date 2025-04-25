const NextJsAnalyzer = require('./core/analyzer');
const moduleManager = require('./modules');
const visualizer = require('./visualizers');
const utils = require('./utils');

module.exports = {
  NextJsAnalyzer,
  moduleManager,
  visualizer,
  utils,
  
  /**
   * Projeyi analiz eder ve sonuçları döndürür
   * @param {string} projectPath - Analiz edilecek proje yolu
   * @param {Object} options - Analiz seçenekleri
   * @returns {Promise<Object>} - Analiz sonuçları
   */
  async analyze(projectPath, options = {}) {
    const analyzer = new NextJsAnalyzer(projectPath);
    const success = await analyzer.analyze();
    
    if (!success) {
      throw new Error('Analiz tamamlanamadı.');
    }
    
    const results = await moduleManager.runAllAnalyses(analyzer, options);
    return {
      analyzer,
      results
    };
  },
  
  /**
   * Belirli bir modülü çalıştırır ve sonuçları döndürür
   * @param {string} moduleName - Çalıştırılacak modül adı
   * @param {string} projectPath - Analiz edilecek proje yolu
   * @param {Object} options - Analiz seçenekleri
   * @returns {Promise<Object>} - Analiz sonuçları
   */
  async analyzeWithModule(moduleName, projectPath, options = {}) {
    const analyzer = new NextJsAnalyzer(projectPath);
    const success = await analyzer.analyze();
    
    if (!success) {
      throw new Error('Analiz tamamlanamadı.');
    }
    
    const results = await moduleManager.runAnalysis(moduleName, analyzer, options);
    return {
      analyzer,
      results
    };
  },
  
  /**
   * Analiz sonuçlarını görselleştirir
   * @param {Object} analysisResult - Analiz sonuçları
   * @param {string} format - Görselleştirme formatı (text, html, json)
   * @returns {string} - Görselleştirilmiş sonuçlar
   */
  visualize(analysisResult, format = 'text') {
    return visualizer.visualizeAll(format, analysisResult.results, analysisResult.analyzer);
  }
};
