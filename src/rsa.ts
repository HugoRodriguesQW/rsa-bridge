interface RSABridgeSettings {
  publicKey: string;
  privateKey: string;
}

export class RSABridge {
  settings: RSABridgeSettings;

  constructor(settings: RSABridgeSettings) {
    this.settings = settings;
  }


  client() {
    return true;
  }
}
