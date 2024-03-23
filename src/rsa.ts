import Express, { Send } from "express";
import NodeRSA from "node-rsa";

export interface BasicRSASettings {
  keys?: {
    public: string;
    private: string;
    format?: BasicRSAKeyFormats | NodeRSA.Format;
  };
  bits: 512 | 1024 | 2048 | 4096;
}

type BasicRSAKeyFormats = {
  public: NodeRSA.Format;
  private: NodeRSA.Format;
};

/** Creates a standard instance of an RSA client with minimal functions to encrypt and decrypt data */
export class BasicRSA {
  encoder: NodeRSA;
  decoder: NodeRSA;
  keyFormats: BasicRSAKeyFormats;

  constructor(setting: BasicRSASettings) {
    this.keyFormats =
      typeof setting.keys?.format === "string"
        ? {
            public: setting.keys.format as NodeRSA.Format,
            private: setting.keys.format as NodeRSA.Format,
          }
        : (setting.keys?.format as BasicRSAKeyFormats);

    this.encoder = setting.keys
      ? new NodeRSA(setting.keys.public, "public" ?? this.keyFormats?.public)
      : new NodeRSA({ b: setting.bits });
    this.decoder = setting.keys
      ? new NodeRSA(setting.keys.private, "private" ?? this.keyFormats?.private)
      : this.encoder;
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

  exportKey() {
    return this.encoder.exportKey("public");
  }

  private toUTF(data: string) {
    return Buffer.from(data, "base64").toString("utf8");
  }

  private toBase64(data: string) {
    return Buffer.from(data).toString("base64");
  }
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

type ClientRSAEvent = "connect" | "connecting";
type ClientRSASubscribe = { cb: () => any; action: ClientRSAEvent };

export class ClientRSA extends BasicRSA {
  serverData: { key: string; format: NodeRSA.Format };
  #serverKeyLoadedPromise: Promise<Response>;
  #subscribes: ClientRSASubscribe[];

  constructor(settings: ClientRSASettings) {
    super(settings);

    this.serverData = { key: "", format: "public" };
    this.#serverKeyLoadedPromise = {} as Promise<Response>;
    this.#subscribes = [];
  }

  on(action: "connect" | "connecting", cb: () => void) {
    this.#subscribes.push({
      action,
      cb,
    });
  }

  async fetch(input: string | URL | Request, options?: RequestInit) {
    await this.#serverKeyLoadedPromise;
    return new Promise((resolve, reject) => {
      console.info(this.serverData);

      fetch(input, {
        ...options,
        body: options?.body
          ? JSON.stringify({
              ___RSADATA: this.encryptWithKey(
                this.serverData.key,
                JSON.stringify(options?.body),
                this.serverData.format
              ),
              ___CLIENTKEY: this.exportKey(),
            } as ServerRSARequestBody)
          : undefined,
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
        RSA.event("connecting");

        fetch(publicKeyEndpoint, options)
          .then(async (res) => {
            try {
              const data: any = await res.json();

              if (data.key && data.format) {
                RSA.serverData = data;
                RSA.event("connect");
                resolve(res);
              }
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

  private event(action: ClientRSAEvent) {
    this.#subscribes = this.#subscribes
      .map((subscribe) => {
        if (subscribe.action === action) {
          subscribe.cb();
          return true;
        }

        return subscribe;
      })
      .filter((s) => s !== true) as ClientRSASubscribe[];
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
      if (typeof res.contentType === "function") res.contentType("text");
      if (typeof res.status === "function") res.status(200);
      return res.json({
        key: this.exportKey(),
        format: this.keyFormats.public,
      });
    };
  }

  handler(): Express.RequestHandler {
    const RSA = this;

    return async (req, res, next) => {
      Object.assign(req, { RSA: this });

      function resolveRequest() {
        if (typeof req.body === "string") {
          try {
            req.body = JSON.parse(req.body);
          } catch {
            return refuseOrNext(RSA.allowUnencryptedIn);
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
                RSA,
                JSON.stringify({
                  ___RSADATA: encrypted,
                })
              );
            } catch (err) {
              res.status(500);
              return originalSend.___preserved.call(
                RSA,
                "Error trying to encrypt response data"
              );
            }
          };
        };

        (res.send as any) = wrapSend(res.send.bind(res) as WrapedSend, RSA);

        Object.assign(req, { CLIENTKEY: ___CLIENTKEY });
        if (___RSADATA) {
          try {
            (req.body as any) = RSA.decrypt(___RSADATA as string);
            console.info("next called");
            return next();
          } catch {
            console.info("payload encrypted with a unknown key");
            return refuseOrNext(RSA.allowUnencryptedIn);
          }
        }

        console.info("next called");

        next();
      }

      const refuseOrNext = (condition: boolean) => {
        if (condition) {
          return res.status(400).send("request refused by rsa service");
        }
        console.info("next called");
        return next();
      };

      if (!req.readable) return resolveRequest();

      req.body = "";

      req.on("data", (chunk) => {
        console.info("receiving data");
        req.body += chunk;
      });

      req.on("end", resolveRequest);
    };
  }
}
