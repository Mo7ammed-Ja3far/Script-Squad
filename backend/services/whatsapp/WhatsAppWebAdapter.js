const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const WhatsAppAdapter = require('./WhatsAppAdapter');

class WhatsAppWebAdapter extends WhatsAppAdapter {
  constructor() {
    super();
    this._client = null;
    this._ready = false;
    this._initializing = false;
  }

  async initialize() {
    if (this._initializing || this._ready) return;
    this._initializing = true;

    this._client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'clinicflow-whatsapp',
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this._client.on('qr', (qr) => {
      console.log('\n════════════════════════════════════════════');
      console.log('  📱 WHATSAPP QR CODE — Scan with your phone');
      console.log('════════════════════════════════════════════\n');
      qrcode.generate(qr, { small: true });
      console.log('\n════════════════════════════════════════════\n');
    });

    this._client.on('authenticated', () => {
      console.log('✅ WhatsApp: Session authenticated successfully');
    });

    this._client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp: Authentication failed —', msg);
      this._ready = false;
      this._initializing = false;
    });

    this._client.on('ready', () => {
      console.log('✅ WhatsApp client is ready and connected');
      this._ready = true;
      this._initializing = false;
    });

    this._client.on('disconnected', (reason) => {
      console.warn('⚠️  WhatsApp client disconnected:', reason);
      this._ready = false;
      this._initializing = false;
    });

    this._client.on('change_state', (state) => {
      console.log('🔄 WhatsApp state changed to:', state);
    });

    await this._client.initialize();
  }

  async sendMessage(to, message) {
    if (!this._ready || !this._client) {
      throw new Error('WhatsApp client is not ready. QR scan may be pending.');
    }

    const sanitized = this._sanitizeNumber(to);
    const chatId = `${sanitized}@c.us`;

    try {
      await this._client.sendMessage(chatId, message);
    } catch (err) {
      throw new Error(`WhatsApp sendMessage failed: ${err.message}`);
    }
  }

  isReady() {
    return this._ready;
  }

  async destroy() {
    if (this._client) {
      await this._client.destroy();
      this._ready = false;
      this._client = null;
    }
  }

  _sanitizeNumber(number) {
    const digits = number.replace(/\D/g, '');
    if (!digits || digits.length < 7) {
      throw new Error(`Invalid WhatsApp number: "${number}"`);
    }
    return digits;
  }
}

module.exports = WhatsAppWebAdapter;
