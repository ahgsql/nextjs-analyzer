const { program } = require('commander');
const path = require('path');
const inquirer = require('inquirer');
const NextJsAnalyzer = require('../core/analyzer');
const moduleManager = require('../modules');
const visualizer = require('../visualizers');
const { logInfo, logSuccess, logError } = require('../utils');

/**
 * Komut satırı komutlarını ayarlar
 * @returns {Object} - Commander program nesnesi
 */
function setupCommands() {
  // Ana komut
  program
    .name('nextjs-analyzer')
    .description('Next.js projelerini analiz eden modüler araç')
    .version('2.1.0');
  
  // Tüm modülleri çalıştır
  program
    .command('analyze')
    .description('Tüm analiz modüllerini çalıştır')
    .option('-p, --path <path>', 'Analiz edilecek Next.js projesinin yolu', process.cwd())
    .option('-o, --output <output>', 'Analiz sonuçlarının kaydedileceği dosya yolu', 'nextjs-analysis')
    .option('-f, --format <format>', 'Çıktı formatı (text, json veya html)', 'text')
    .option('-v, --verbose', 'Detaylı çıktı göster', false)
    .action(async (options) => {
      try {
        // Analiz işlemini başlat
        const analyzer = new NextJsAnalyzer(path.resolve(options.path));
        const success = await analyzer.analyze();
        
        if (!success) {
          logError('Analiz tamamlanamadı.');
          process.exit(1);
        }
        
        // Modül seçimi için interaktif menü
        const modules = moduleManager.getAllModules();
        const moduleChoices = modules.map(module => ({
          name: `${module.name}: ${module.description}`,
          value: module.name
        }));
        
        // Tüm modüller seçeneği ekle
        moduleChoices.unshift({
          name: 'Tüm modüller: Tüm analiz modüllerini çalıştır',
          value: 'all'
        });
        
        // Format seçimi için interaktif menü
        const formatChoices = [
          { name: 'Metin (text)', value: 'text' },
          { name: 'HTML', value: 'html' },
          { name: 'JSON', value: 'json' }
        ];
        
        // Kullanıcıdan seçim yapmasını iste
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'module',
            message: 'Hangi modülü çalıştırmak istiyorsunuz?',
            choices: moduleChoices
          },
          {
            type: 'list',
            name: 'format',
            message: 'Hangi formatta çıktı almak istiyorsunuz?',
            choices: formatChoices,
            default: options.format
          }
        ]);
        
        // Seçilen modülü çalıştır
        logInfo('Modüller çalıştırılıyor...');
        let results;
        
        if (answers.module === 'all') {
          results = await moduleManager.runAllAnalyses(analyzer, { ...options, format: answers.format });
          
          // Sonuçları görselleştir
          logInfo('Sonuçlar görselleştiriliyor...');
          const output = visualizer.visualizeAll(answers.format, results, analyzer);
          
          // Sonuçları dosyaya kaydet
          visualizer.saveToFile(options.output, answers.format, output);
        } else {
          results = await moduleManager.runAnalysis(answers.module, analyzer, { ...options, format: answers.format });
          
          // Sonuçları görselleştir
          logInfo('Sonuçlar görselleştiriliyor...');
          const output = visualizer.visualize(answers.module, answers.format, results, analyzer);
          
          // Sonuçları dosyaya kaydet
          const outputFile = `nextjs-${answers.module}-analysis`;
          visualizer.saveToFile(outputFile, answers.format, output);
        }
        
        logSuccess('Analiz tamamlandı.');
      } catch (error) {
        logError('Beklenmeyen bir hata oluştu:', error);
        process.exit(1);
      }
    });
  
  // Her bir modül için ayrı komut
  for (const module of moduleManager.getAllModules()) {
    program
      .command(`analyze:${module.name}`)
      .description(module.description)
      .option('-p, --path <path>', 'Analiz edilecek Next.js projesinin yolu', process.cwd())
      .option('-o, --output <output>', 'Analiz sonuçlarının kaydedileceği dosya yolu', `nextjs-${module.name}-analysis`)
      .option('-f, --format <format>', 'Çıktı formatı (text, json veya html)', 'text')
      .option('-v, --verbose', 'Detaylı çıktı göster', false)
      .action(async (options) => {
        try {
          // Analiz işlemini başlat
          const analyzer = new NextJsAnalyzer(path.resolve(options.path));
          const success = await analyzer.analyze();
          
          if (!success) {
            logError('Analiz tamamlanamadı.');
            process.exit(1);
          }
          
          // Belirli bir modülü çalıştır
          logInfo(`${module.name} modülü çalıştırılıyor...`);
          const results = await moduleManager.runAnalysis(module.name, analyzer, options);
          
          // Sonuçları görselleştir
          logInfo('Sonuçlar görselleştiriliyor...');
          const output = visualizer.visualize(module.name, options.format, results, analyzer);
          
          // Sonuçları dosyaya kaydet
          visualizer.saveToFile(options.output, options.format, output);
          
          logSuccess('Analiz tamamlandı.');
        } catch (error) {
          logError('Beklenmeyen bir hata oluştu:', error);
          process.exit(1);
        }
      });
  }
  
  // Modül listesi komutu
  program
    .command('list-modules')
    .description('Kullanılabilir analiz modüllerini listeler')
    .action(() => {
      const modules = moduleManager.getAllModules();
      
      logInfo('Kullanılabilir Analiz Modülleri:');
      modules.forEach(module => {
        console.log(`- ${module.name}: ${module.description}`);
      });
    });
  
  return program;
}

module.exports = { setupCommands };
