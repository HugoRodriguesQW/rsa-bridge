import NodeRSA from "node-rsa";
import f from "../utils/string";

export interface BasicRSAConfig {
  keys?: {
    public: string;
    private: string;
    format?: BasicKeyFormats | NodeRSA.Format;
  };
  bits?: 512 | 1024 | 2048 | 4096;
}

type BasicKeyFormats = {
  public: NodeRSA.Format;
  private: NodeRSA.Format;
};

/** Generic model with default methods for powered by NodeRSA.
 * used in both frontend and backend
 */
export class BasicRSA {
  encoder: NodeRSA;
  decoder: NodeRSA;
  keyFormats: BasicKeyFormats;

  constructor(setting?: BasicRSAConfig) {
    this.keyFormats = {} as BasicKeyFormats;
    this.encoder = this.decoder = {} as NodeRSA;

    this.importKeyFormats(setting?.keys);
    this.generateNodes(setting?.keys, setting?.bits);
  }

  encrypt(data: string) {
    return this.encoder.encrypt(data, "base64");
  }

  decrypt(data: string) {
    return this.decoder.decrypt(data, "utf8");
  }

  encryptWithKey(key: string, data: string, format?: NodeRSA.Format) {
    const customEncoder = new NodeRSA(key, format);
    return customEncoder.encrypt(data, "base64");
  }

  publicKey(customFormat?: NodeRSA.FormatPem, encoding?: BufferEncoding) {
    const key = this.encoder.exportKey(customFormat || "public");
    if (!encoding) return key;
    return f(key, "utf8").to(encoding);
  }

  private importKeyFormats(keys: BasicRSAConfig["keys"]) {
    if (typeof keys?.format === "object") {
      this.keyFormats = keys.format;
    }

    if (typeof keys?.format === "string") {
      this.keyFormats.public = this.keyFormats.private = keys.format;
    }

    if (!keys?.format) {
      this.keyFormats = {
        public: "public",
        private: "private",
      };
    }
  }

  private generateNodes(
    keys: BasicRSAConfig["keys"],
    bits: BasicRSAConfig["bits"]
  ) {
    if (keys) {
      this.encoder = new NodeRSA(keys.public, this.keyFormats.public);
      this.decoder = new NodeRSA(keys.private, this.keyFormats.private);
    } else {
      this.encoder = this.decoder = new NodeRSA({ b: bits ?? 1024 });
    }
  }
}
