class WhatsAppAdapter {
  async initialize() {
    throw new Error('initialize() must be implemented by adapter');
  }

  async sendMessage(to, message) {
    throw new Error('sendMessage() must be implemented by adapter');
  }

  isReady() {
    throw new Error('isReady() must be implemented by adapter');
  }

  async destroy() {
    throw new Error('destroy() must be implemented by adapter');
  }
}

module.exports = WhatsAppAdapter;
