const { program } = require('commander');
const path = require('path');
const inquirer = require('inquirer');
const NextJsAnalyzer = require('../core/analyzer');
const moduleManager = require('../modules');
const visualizer = require('../visualizers');
const { logInfo, logSuccess, logError, i18n, settings } = require('../utils');

/**
 * Komut satırı komutlarını ayarlar
 * @returns {Object} - Commander program nesnesi
 */
function setupCommands() {
  // Ana komut
  program
    .name(i18n.t('cli.name'))
    .description(i18n.t('cli.description'))
    .version('2.1.0');
  
  // Tüm modülleri çalıştır
  program
    .command('analyze')
    .description(i18n.t('cli.commands.analyze.description'))
    .option('-p, --path <path>', i18n.t('cli.commands.analyze.options.path'), process.cwd())
    .option('-o, --output <output>', i18n.t('cli.commands.analyze.options.output'), 'nextjs-analysis')
    .option('-f, --format <format>', i18n.t('cli.commands.analyze.options.format'), 'text')
    .option('-v, --verbose', i18n.t('cli.commands.analyze.options.verbose'), false)
    .action(async (options) => {
      try {
        // Analiz işlemini başlat
        const analyzer = new NextJsAnalyzer(path.resolve(options.path));
        const success = await analyzer.analyze();
        
        if (!success) {
          logError(i18n.t('analyzer.messages.analysisFailed'));
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
          name: i18n.t('cli.commands.analyze.messages.allModules'),
          value: 'all'
        });
        
        // Format seçimi için interaktif menü
        const formatChoices = [
          { name: i18n.t('cli.formats.text'), value: 'text' },
          { name: i18n.t('cli.formats.html'), value: 'html' },
          { name: i18n.t('cli.formats.json'), value: 'json' }
        ];
        
        // Kullanıcıdan seçim yapmasını iste
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'module',
            message: i18n.t('cli.commands.analyze.messages.moduleSelection'),
            choices: moduleChoices
          },
          {
            type: 'list',
            name: 'format',
            message: i18n.t('cli.commands.analyze.messages.formatSelection'),
            choices: formatChoices,
            default: options.format
          }
        ]);
        
        // Seçilen modülü çalıştır
        logInfo(i18n.t('cli.commands.analyze.messages.runningModules'));
        let results;
        
        if (answers.module === 'all') {
          results = await moduleManager.runAllAnalyses(analyzer, { ...options, format: answers.format });
          
          // Sonuçları görselleştir
          logInfo(i18n.t('cli.commands.analyze.messages.visualizing'));
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
        
        logSuccess(i18n.t('cli.commands.analyze.messages.completed'));
      } catch (error) {
        logError(i18n.t('analyzer.messages.unexpectedError'), error);
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
    .description(i18n.t('cli.commands.listModules.description'))
    .action(() => {
      const modules = moduleManager.getAllModules();
      
      logInfo(i18n.t('cli.commands.listModules.messages.availableModules'));
      modules.forEach(module => {
        console.log(`- ${module.name}: ${module.description}`);
      });
    });
  
  // Ayarlar komutu
  program
    .command('settings')
    .description(i18n.t('cli.commands.settings.description'))
    .action(async () => {
      try {
        // Dil seçimi için interaktif menü
        const languages = i18n.getAvailableLanguages();
        const languageChoices = Object.entries(languages).map(([code, name]) => ({
          name,
          value: code
        }));
        
        // Kullanıcıdan dil seçimi yapmasını iste
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'language',
            message: i18n.t('cli.commands.settings.messages.languageSelection'),
            choices: languageChoices,
            default: i18n.getCurrentLanguage()
          }
        ]);
        
        // Dili değiştir
        if (i18n.setLanguage(answers.language)) {
          logSuccess(i18n.t('cli.commands.settings.messages.languageChanged', { language: languages[answers.language] }));
          logSuccess(i18n.t('cli.commands.settings.messages.settingsSaved'));
        }
      } catch (error) {
        logError(i18n.t('analyzer.messages.unexpectedError'), error);
        process.exit(1);
      }
    });
  
  return program;
}

module.exports = { setupCommands };
