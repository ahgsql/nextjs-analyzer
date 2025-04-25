const { setupCommands } = require('./commands');
const { logError } = require('../utils');

/**
 * CLI uygulamasını başlatır
 */
function run() {
  try {
    const program = setupCommands();
    program.parse(process.argv);
    
    // Eğer hiçbir komut belirtilmemişse, yardım göster
    if (process.argv.length <= 2) {
      program.help();
    }
  } catch (error) {
    logError('CLI başlatılırken hata oluştu:', error);
    process.exit(1);
  }
}

module.exports = { run };
