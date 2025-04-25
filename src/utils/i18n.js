const fs = require('fs-extra');
const path = require('path');
const settings = require('./settings');

/**
 * Dil yönetimi için yardımcı fonksiyonlar
 */
class I18n {
  constructor() {
    this.languages = {
      tr: require('../locales/tr'),
      en: require('../locales/en')
    };
    
    // Varsayılan dil: İngilizce
    this.defaultLanguage = 'en';
    
    // Mevcut dili ayarlardan yükle veya varsayılanı kullan
    this.currentLanguage = settings.get('language') || this.defaultLanguage;
  }
  
  /**
   * Mevcut dili döndürür
   * @returns {string} - Mevcut dil kodu
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Dili değiştirir
   * @param {string} language - Dil kodu (tr, en)
   * @returns {boolean} - Başarılı ise true, değilse false
   */
  setLanguage(language) {
    if (!this.languages[language]) {
      return false;
    }
    
    this.currentLanguage = language;
    settings.set('language', language);
    return true;
  }
  
  /**
   * Belirtilen anahtara göre çeviriyi döndürür
   * @param {string} key - Çeviri anahtarı (dot notation, örn: 'common.error')
   * @param {Object} params - Çeviride kullanılacak parametreler
   * @returns {string} - Çevrilmiş metin
   */
  t(key, params = {}) {
    // Mevcut dildeki çeviriyi bul
    const translation = this._getTranslation(key, this.currentLanguage);
    
    // Eğer çeviri bulunamazsa, varsayılan dildeki çeviriyi dene
    if (translation === key && this.currentLanguage !== this.defaultLanguage) {
      const defaultTranslation = this._getTranslation(key, this.defaultLanguage);
      return this._replaceParams(defaultTranslation, params);
    }
    
    return this._replaceParams(translation, params);
  }
  
  /**
   * Belirtilen anahtara göre çeviriyi bulur
   * @param {string} key - Çeviri anahtarı (dot notation)
   * @param {string} language - Dil kodu
   * @returns {string} - Çevrilmiş metin veya anahtar
   * @private
   */
  _getTranslation(key, language) {
    const keys = key.split('.');
    let translation = this.languages[language];
    
    // Anahtarı takip ederek çeviriyi bul
    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        return key; // Çeviri bulunamadı, anahtarı döndür
      }
    }
    
    // Eğer çeviri bir string değilse, anahtarı döndür
    return typeof translation === 'string' ? translation : key;
  }
  
  /**
   * Çevirideki parametreleri değiştirir
   * @param {string} text - Çevrilmiş metin
   * @param {Object} params - Çeviride kullanılacak parametreler
   * @returns {string} - Parametreleri değiştirilmiş metin
   * @private
   */
  _replaceParams(text, params) {
    if (typeof text !== 'string') {
      return text;
    }
    
    return text.replace(/{([^{}]*)}/g, (match, key) => {
      const value = params[key];
      return value !== undefined ? value : match;
    });
  }
  
  /**
   * Kullanılabilir dilleri döndürür
   * @returns {Object} - Dil kodları ve adları
   */
  getAvailableLanguages() {
    return {
      tr: 'Türkçe',
      en: 'English'
    };
  }
}

// Singleton instance
const i18n = new I18n();

module.exports = i18n;
