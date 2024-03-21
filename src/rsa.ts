import Express, { Send } from "express";
import NodeRSA from "node-rsa";

interface BasicRSASettings {
  keys?: {
    public: string;
    private: string;
    format?:
      | {
          public: NodeRSA.Format;
          private: NodeRSA.Format;
        }
      | NodeRSA.Format;
  };
  bits: 512 | 1024 | 2048 | 4096;
}

interface ServerRSASettings extends BasicRSASettings {
  allowUnencryptedIn: boolean;
}

interface ClientRSASettings {
  bits: BasicRSASettings["bits"];
}

type ServerRSARequestBody = {
  ___RSADATA: RequestInit["body"];
  ___CLIENTKEY: string;
};

type ClientRSAResponseBody = {
  ___RSADATA: string;
};

export interface RequestRSA {
  RSA: ServerRSA;
  CLIENTKEY?: string;
}

interface WrapedSend extends Send {
  ___preserved: Send;
}

/** Creates a standard instance of an RSA client with minimal functions to encrypt and decrypt data
 */
export class BasicRSA {
  #encoder: NodeRSA;
  #decoder: NodeRSA;

  constructor(setting: BasicRSASettings) {
    const keyFormats =
      typeof setting.keys?.format === "string"
        ? {
            public: setting.keys.format as string,
            private: setting.keys.format as string,
          }
        : setting.keys?.format;

    this.#encoder = setting.keys
      ? new NodeRSA(setting.keys.public, "public" ?? keyFormats?.public)
      : new NodeRSA({ b: setting.bits });
    this.#decoder = setting.keys
      ? new NodeRSA(setting.keys.private, "private" ?? keyFormats?.private)
      : this.#encoder;
  }

  encrypt(data: string) {
    return this.#encoder.encrypt(data, "base64");
  }

  decrypt(data: string) {
    return this.#decoder.decrypt(data, "utf8");
  }

  encryptWithKey(key: string, data: string) {
    const customEncoder = new NodeRSA(this.toUTF(key));
    return customEncoder.encrypt(data, "base64");
  }

  exportKey() {
    return this.#encoder.exportKey("public");
  }

  private toUTF(data: string) {
    return Buffer.from(data, "base64").toString("utf8");
  }

  private toBase64(data: string) {
    return Buffer.from(data).toString("base64");
  }
}

export class ClientRSA extends BasicRSA {
  serverKey: string;
  #serverKeyLoadedPromise: Promise<Response>;

  constructor(settings: ClientRSASettings) {
    super(settings);

    this.serverKey = "";
    this.#serverKeyLoadedPromise = {} as Promise<Response>;
  }

  async fetch(input: string | URL | Request, options?: RequestInit) {
    await this.#serverKeyLoadedPromise;

    return new Promise((resolve, reject) => {
      fetch(input, {
        ...options,
        body: JSON.stringify({
          ___RSADATA: options?.body,
          ___CLIENTKEY: this.exportKey(),
        } as ServerRSARequestBody),
      })
        .then(async (response) => {
          try {
            const result = (await response.json()) as
              | ClientRSAResponseBody
              | string;

            if (typeof result === "string") return reject(result);
            const RSAResult = (result as ClientRSAResponseBody).___RSADATA;

            if (RSAResult) {
              try {
                resolve(this.decrypt(RSAResult));
              } catch (err) {
                reject(err);
              }
            }
          } catch (err) {
            reject(err);
          }
        })
        .catch(reject);
    });
  }

  connect(publicKeyEndpoint: string | URL | Request, options?: RequestInit) {
    this.#serverKeyLoadedPromise = new Promise((resolve) => {
      const RSA = this;
      (function tryIt() {
        fetch(publicKeyEndpoint, options)
          .then(async (res) => {
            try {
              RSA.serverKey = await res.text();
              resolve(res);
            } catch (err) {
              console.error("> can't connect to RSA server: ", err);
              setTimeout(tryIt, 1000);
            }
          })
          .catch((err) => {
            console.error("> can't connect to RSA server: ", err);
            setTimeout(tryIt, 1000);
          });
      })();
    });
  }
}

export class ServerRSA extends BasicRSA {
  allowUnencryptedIn: ServerRSASettings["allowUnencryptedIn"];

  constructor(settings: ServerRSASettings) {
    super(settings);
    this.allowUnencryptedIn = settings.allowUnencryptedIn ?? true;
  }

  propagateKey(): Express.RequestHandler {
    return (req, res) => {
      res.contentType("text");
      return res.status(200).send(this.exportKey());
    };
  }

  handler(): Express.RequestHandler {
    return (req, res, next) => {
      Object.assign(req, { RSA: this });

      req.body = "";
      req.on("data", (chunk) => (req.body += chunk));

      req.on("end", () => {
        const refuseOrNext = (condition: boolean) => {
          if (condition) {
            return res.status(400).send("request refused by rsa service");
          }
          return next();
        };

        if (typeof req.body === "string") {
          try {
            req.body = JSON.parse(req.body);
          } catch {
            return refuseOrNext(this.allowUnencryptedIn);
          }
        }

        const ___RSADATA = (req.body as ServerRSARequestBody)?.___RSADATA;
        const ___CLIENTKEY = req.headers["x-client-token"] as string;

        if (!___CLIENTKEY) {
          return refuseOrNext(!___CLIENTKEY);
        }

        const wrapSend = (originalSend: WrapedSend, RSA: ServerRSA) => {
          originalSend.___preserved = originalSend;

          return (data: any) => {
            try {
              const encrypted = RSA.encryptWithKey(
                ___CLIENTKEY,
                typeof data === "string" ? data : JSON.stringify(data)
              );

              return originalSend.___preserved.call(
                this,
                JSON.stringify({
                  ___RSADATA: encrypted,
                })
              );
            } catch (err) {
              res.status(500);
              return originalSend.___preserved.call(
                this,
                "Error trying to encrypt response data"
              );
            }
          };
        };

        (res.send as any) = wrapSend(res.send.bind(res) as WrapedSend, this);

        Object.assign(req, { CLIENTKEY: ___CLIENTKEY });
        if (___RSADATA) {
          try {
            (req.body as any) = this.decrypt(___RSADATA as string);
            return next();
          } catch {
            console.info("payload encrypted with a unknown key");
            return refuseOrNext(this.allowUnencryptedIn);
          }
        }

        next();
      });
    };
  }
}
