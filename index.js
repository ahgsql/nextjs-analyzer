#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const NextJsAnalyzer = require('./analyzer');

// Komut satırı argümanlarını tanımla
program
  .name('nextjs-analyzer')
  .description('Next.js projelerinde server ve client componentleri analiz eden araç')
  .version('1.0.0')
  .option('-p, --path <path>', 'Analiz edilecek Next.js projesinin yolu', process.cwd())
  .option('-o, --output <output>', 'Analiz sonuçlarının kaydedileceği dosya yolu', 'nextjs-analysis.txt')
  .option('-f, --format <format>', 'Çıktı formatı (text, json veya html)', 'text')
  .option('-v, --verbose', 'Detaylı çıktı göster', false)
  .parse(process.argv);

const options = program.opts();

// Ana fonksiyon
async function main() {
  console.log(chalk.blue('Next.js Analyzer v1.0.0'));
  console.log(chalk.blue('----------------------------'));
  
  const projectPath = path.resolve(options.path);
  
  // Proje dizininin varlığını kontrol et
  if (!fs.existsSync(projectPath)) {
    console.error(chalk.red(`Hata: ${projectPath} dizini bulunamadı.`));
    process.exit(1);
  }
  
  // package.json dosyasını kontrol ederek Next.js projesi olup olmadığını doğrula
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.warn(chalk.yellow(`Uyarı: ${projectPath} dizininde package.json dosyası bulunamadı.`));
    console.warn(chalk.yellow('Bu bir Next.js projesi olmayabilir.'));
  } else {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasNextDependency = packageJson.dependencies && packageJson.dependencies.next;
      
      if (!hasNextDependency) {
        console.warn(chalk.yellow('Uyarı: package.json dosyasında next bağımlılığı bulunamadı.'));
        console.warn(chalk.yellow('Bu bir Next.js projesi olmayabilir.'));
      } else {
        console.log(chalk.green(`Next.js sürümü: ${packageJson.dependencies.next}`));
      }
    } catch (error) {
      console.warn(chalk.yellow('Uyarı: package.json dosyası okunamadı.'), error);
    }
  }
  
  console.log(chalk.blue(`Proje dizini: ${projectPath}`));
  
  // Analiz işlemini başlat
  const analyzer = new NextJsAnalyzer(projectPath);
  const success = await analyzer.analyze();
  
  if (!success) {
    console.error(chalk.red('Analiz tamamlanamadı.'));
    process.exit(1);
  }
  
  // Analiz sonuçlarını göster
  console.log(chalk.blue('\nAnaliz Sonuçları:'));
  console.log(analyzer.generateTreeView());
  
  // Analiz sonuçlarını dosyaya kaydet
  let outputPath = path.resolve(options.output);
  
  // Format parametresine göre çıktı dosyasının uzantısını otomatik olarak değiştir
  if (options.format === 'json' && !outputPath.toLowerCase().endsWith('.json')) {
    outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.json';
  } else if (options.format === 'html' && !outputPath.toLowerCase().endsWith('.html')) {
    outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.html';
  } else if (options.format === 'text' && !outputPath.toLowerCase().endsWith('.txt')) {
    outputPath = outputPath.replace(/\.[^/.]+$/, '') + '.txt';
  }
  
  analyzer.saveToFile(outputPath, options.format);
  
  console.log(chalk.blue('\nAnaliz tamamlandı.'));
}

// Programı çalıştır
main().catch(error => {
  console.error(chalk.red('Beklenmeyen bir hata oluştu:'), error);
  process.exit(1);
});
