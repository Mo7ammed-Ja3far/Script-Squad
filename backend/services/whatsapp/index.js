const WhatsAppService = require('./WhatsAppService');
const WhatsAppWebAdapter = require('./WhatsAppWebAdapter');

const adapter = new WhatsAppWebAdapter();
const whatsappService = new WhatsAppService(adapter);

module.exports = whatsappService;
