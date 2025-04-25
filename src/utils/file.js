const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Belirtilen dizindeki tüm JavaScript/TypeScript dosyalarını bulur
 * @param {string} dir - Taranacak dizin
 * @param {Array<string>} extensions - Taranacak dosya uzantıları
 * @returns {Array<string>} - Bulunan dosyaların tam yolları
 */
function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  if (!fs.existsSync(dir)) {
    console.error(chalk.red(`Hata: ${dir} dizini bulunamadı.`));
    return [];
  }

  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
      // Alt dizinleri rekursif olarak tara
      results = results.concat(findFiles(filePath, extensions));
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });

  return results;
}

/**
 * Dosya yolundan göreceli yol oluşturur
 * @param {string} filePath - Tam dosya yolu
 * @param {string} basePath - Baz alınacak dizin
 * @returns {string} - Göreceli yol
 */
function getRelativePath(filePath, basePath) {
  return path.relative(basePath, filePath);
}

module.exports = {
  findFiles,
  getRelativePath
};
