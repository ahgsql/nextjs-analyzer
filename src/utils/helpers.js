const chalk = require('chalk');

/**
 * ANSI renk kodlarını kaldırır
 * @param {string} str - ANSI renk kodları içeren metin
 * @returns {string} - ANSI renk kodları kaldırılmış metin
 */
function stripAnsi(str) {
  return str.replace(/\x1B\[\d+m/g, '');
}

/**
 * Konsol çıktısındaki ASCII karakterleri emoji karakterleriyle değiştirir
 * @param {string} content - Değiştirilecek metin
 * @returns {string} - Emoji karakterleri eklenmiş metin
 */
function replaceAsciiWithEmoji(content) {
  return content
    .replace(/\[DIR\]/g, '📁')
    .replace(/\[FILE\]/g, '📄');
}

/**
 * Hata mesajını biçimlendirir ve konsola yazdırır
 * @param {string} message - Hata mesajı
 * @param {Error} [error] - Hata nesnesi (opsiyonel)
 */
function logError(message, error) {
  console.error(chalk.red(message), error || '');
}

/**
 * Bilgi mesajını biçimlendirir ve konsola yazdırır
 * @param {string} message - Bilgi mesajı
 */
function logInfo(message) {
  console.log(chalk.blue(message));
}

/**
 * Başarı mesajını biçimlendirir ve konsola yazdırır
 * @param {string} message - Başarı mesajı
 */
function logSuccess(message) {
  console.log(chalk.green(message));
}

/**
 * Uyarı mesajını biçimlendirir ve konsola yazdırır
 * @param {string} message - Uyarı mesajı
 */
function logWarning(message) {
  console.log(chalk.yellow(message));
}

module.exports = {
  stripAnsi,
  replaceAsciiWithEmoji,
  logError,
  logInfo,
  logSuccess,
  logWarning
};
