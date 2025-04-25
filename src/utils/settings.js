const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { logError } = require('./helpers');

/**
 * Kullanıcı ayarlarını yöneten sınıf
 */
class Settings {
  constructor() {
    // Ayarlar dosyasının yolu
    this.settingsDir = path.join(os.homedir(), '.nextjs-analyzer');
    this.settingsFile = path.join(this.settingsDir, 'settings.json');
    
    // Varsayılan ayarlar
    this.defaultSettings = {
      language: 'en', // Varsayılan dil: İngilizce
      format: 'text', // Varsayılan çıktı formatı
      verbose: false  // Varsayılan detay seviyesi
    };
    
    // Ayarları yükle
    this.settings = this._loadSettings();
  }
  
  /**
   * Ayarları dosyadan yükler
   * @returns {Object} - Yüklenen ayarlar
   * @private
   */
  _loadSettings() {
    try {
      // Ayarlar dizini yoksa oluştur
      if (!fs.existsSync(this.settingsDir)) {
        fs.mkdirpSync(this.settingsDir);
      }
      
      // Ayarlar dosyası yoksa varsayılan ayarları kaydet
      if (!fs.existsSync(this.settingsFile)) {
        fs.writeJsonSync(this.settingsFile, this.defaultSettings, { spaces: 2 });
        return { ...this.defaultSettings };
      }
      
      // Ayarları oku
      const settings = fs.readJsonSync(this.settingsFile);
      
      // Eksik ayarları varsayılan değerlerle tamamla
      return { ...this.defaultSettings, ...settings };
    } catch (error) {
      logError('Ayarlar yüklenirken hata oluştu:', error);
      return { ...this.defaultSettings };
    }
  }
  
  /**
   * Ayarları dosyaya kaydeder
   * @private
   */
  _saveSettings() {
    try {
      // Ayarlar dizini yoksa oluştur
      if (!fs.existsSync(this.settingsDir)) {
        fs.mkdirpSync(this.settingsDir);
      }
      
      // Ayarları kaydet
      fs.writeJsonSync(this.settingsFile, this.settings, { spaces: 2 });
      return true;
    } catch (error) {
      logError('Ayarlar kaydedilirken hata oluştu:', error);
      return false;
    }
  }
  
  /**
   * Belirtilen ayarı döndürür
   * @param {string} key - Ayar anahtarı
   * @param {*} defaultValue - Ayar bulunamazsa döndürülecek varsayılan değer
   * @returns {*} - Ayar değeri
   */
  get(key, defaultValue) {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }
  
  /**
   * Belirtilen ayarı günceller
   * @param {string} key - Ayar anahtarı
   * @param {*} value - Ayar değeri
   * @returns {boolean} - Başarılı ise true, değilse false
   */
  set(key, value) {
    this.settings[key] = value;
    return this._saveSettings();
  }
  
  /**
   * Birden fazla ayarı günceller
   * @param {Object} settings - Güncellenecek ayarlar
   * @returns {boolean} - Başarılı ise true, değilse false
   */
  update(settings) {
    this.settings = { ...this.settings, ...settings };
    return this._saveSettings();
  }
  
  /**
   * Tüm ayarları döndürür
   * @returns {Object} - Tüm ayarlar
   */
  getAll() {
    return { ...this.settings };
  }
  
  /**
   * Ayarları varsayılan değerlere sıfırlar
   * @returns {boolean} - Başarılı ise true, değilse false
   */
  reset() {
    this.settings = { ...this.defaultSettings };
    return this._saveSettings();
  }
}

// Singleton instance
const settings = new Settings();

module.exports = settings;
