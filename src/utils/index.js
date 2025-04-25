const fileUtils = require('./file');
const parserUtils = require('./parser');
const helpers = require('./helpers');
const i18n = require('./i18n');
const settings = require('./settings');

module.exports = {
  ...fileUtils,
  ...parserUtils,
  ...helpers,
  i18n,
  settings
};
