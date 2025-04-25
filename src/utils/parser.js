const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Dosya içeriğinde 'use client' direktifi olup olmadığını kontrol eder
 * @param {string} filePath - Kontrol edilecek dosyanın yolu
 * @returns {boolean} - 'use client' direktifi varsa true, yoksa false
 */
function hasUseClientDirective(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // 'use client' direktifini ara (yorum satırları hariç)
    const useClientRegex = /^\s*['"]use client['"]\s*;?/m;
    return useClientRegex.test(content);
  } catch (error) {
    console.error(chalk.red(`Hata: ${filePath} dosyası okunamadı.`), error);
    return false;
  }
}

/**
 * Dosya içeriğinden import edilen modülleri çıkarır
 * @param {string} filePath - İncelenecek dosyanın yolu
 * @returns {Array<{source: string, path: string}>} - Import edilen modüller
 */
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // ES6 import ifadelerini bul
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^\s,]+|[^\s,{]+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Sadece yerel import'ları al (node_modules hariç)
      if (!importPath.startsWith('@') && !importPath.startsWith('.')) {
        continue;
      }
      
      imports.push({
        source: importPath,
        path: resolveImportPath(filePath, importPath)
      });
    }
    
    return imports;
  } catch (error) {
    console.error(chalk.red(`Hata: ${filePath} dosyası okunamadı.`), error);
    return [];
  }
}

/**
 * Import edilen modülün tam dosya yolunu çözer
 * @param {string} currentFilePath - Mevcut dosyanın yolu
 * @param {string} importPath - Import ifadesindeki yol
 * @returns {string|null} - Çözümlenmiş dosya yolu veya null
 */
function resolveImportPath(currentFilePath, importPath) {
  try {
    const currentDir = path.dirname(currentFilePath);
    
    // @ ile başlayan import'ları src/ dizinine çözümle
    if (importPath.startsWith('@/')) {
      // Projenin kök dizinini bul
      let rootDir = currentDir;
      while (!fs.existsSync(path.join(rootDir, 'package.json')) && rootDir !== path.parse(rootDir).root) {
        rootDir = path.dirname(rootDir);
      }
      
      // jsconfig.json veya tsconfig.json'dan paths ayarlarını kontrol et
      let srcDir = 'src';
      const jsconfigPath = path.join(rootDir, 'jsconfig.json');
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      
      if (fs.existsSync(jsconfigPath)) {
        const jsconfig = JSON.parse(fs.readFileSync(jsconfigPath, 'utf8'));
        if (jsconfig.compilerOptions && jsconfig.compilerOptions.paths && jsconfig.compilerOptions.paths['@/*']) {
          const pathMapping = jsconfig.compilerOptions.paths['@/*'][0];
          srcDir = pathMapping.replace('*', '').replace(/^\//, '');
        }
      } else if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths && tsconfig.compilerOptions.paths['@/*']) {
          const pathMapping = tsconfig.compilerOptions.paths['@/*'][0];
          srcDir = pathMapping.replace('*', '').replace(/^\//, '');
        }
      }
      
      const resolvedPath = path.join(rootDir, srcDir, importPath.slice(2));
      return resolveWithExtension(resolvedPath);
    }
    
    // Göreceli import'ları çözümle
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolvedPath = path.join(currentDir, importPath);
      return resolveWithExtension(resolvedPath);
    }
    
    return null;
  } catch (error) {
    console.error(chalk.red(`Hata: ${importPath} çözümlenemedi.`), error);
    return null;
  }
}

/**
 * Dosya yoluna uygun uzantıyı ekler
 * @param {string} filePath - Uzantısız dosya yolu
 * @returns {string|null} - Uzantılı dosya yolu veya null
 */
function resolveWithExtension(filePath) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx'];
  
  // Doğrudan dosya varsa
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }
  
  // Uzantıları dene
  for (const ext of extensions) {
    const pathWithExt = filePath + ext;
    if (fs.existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }
  
  // index dosyasını dene
  for (const ext of extensions) {
    const indexPath = path.join(filePath, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

module.exports = {
  hasUseClientDirective,
  extractImports,
  resolveImportPath,
  resolveWithExtension
};
