import NodeRSA from "node-rsa";
import { BasicRSA, BasicRSAConfig } from "./basic";
import { EventSubscriber } from "../utils/events";

interface ClientConfig {
  bits: BasicRSAConfig["bits"];
}

type EventSubscription = {
  cb: (rsa: RSAClient) => any;
  action: "connect" | "connecting";
};

type ServerNodeProps = {
  key: string;
  format: NodeRSA.Format;
};

export class RSAClient extends BasicRSA {
  serverNode?: ServerNodeProps;
  #connectPromise?: Promise<Response>;
  #event: EventSubscriber;

  constructor(settings: ClientConfig) {
    super({ bits: settings.bits });
    this.#connectPromise = new Promise(() => {});
    this.#event = new EventSubscriber(this);
  }

  async fetch(input: string | URL | Request, options?: RequestInit) {
    await this.#connectPromise;

    return new Promise((resolve, reject) => {
      const parsedOptions = this.parseRequestOptions(options);
      console.info("> requesting: ", input, parsedOptions);
      fetch(input, this.parseRequestOptions(options))
        .then(async (response) => {
          try {
            const result = (await response.text()) as string;

            if (result.length && typeof result !== "string") {
              return reject("server response data must be string");
            }
            try {
              resolve({ body: this.decrypt(result), response });
            } catch (err: any) {
              reject("error decrypting data: " + err);
            }
          } catch (err: any) {
            reject("error fetching data: " + err);
          }
        })
        .catch(reject);
    }) as Promise<{ body: string; response: Response }>;
  }

  connect(publicKeyEndpoint: string | URL | Request, options?: RequestInit) {
    this.#connectPromise = new Promise((resolve) => {
      const RSA = this;
      (function tryIt() {
        RSA.#event.emit("connecting");

        fetch(publicKeyEndpoint, options)
          .then(async (res) => {
            try {
              const node = (await res.json()) as RSAClient["serverNode"];

              if (!node?.format || !node.key) throw new Error();
              RSA.serverNode = node;
              RSA.#event.emit("connect");
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

  on(action: EventSubscription["action"], cb: (rsa: RSAClient) => any) {
    this.#event.add(action, cb);
  }

  private parseRequestOptions(options?: RequestInit): RequestInit | undefined {
    if (!this.serverNode) throw new Error("serverNode.key not found");
    if (!options) return options;

    const parsedOptions = { ...options };

    parsedOptions.headers = {
      ...options.headers,
      "x-client-key": this.publicKey("public", "base64"),
    };

    if (options?.body) {
      try {
        parsedOptions.body = this.encryptWithKey(
          this.serverNode.key,
          JSON.stringify(options)
        );
      } catch {
        throw new Error("error encrypting data with serverNode.key");
      }
    }

    return parsedOptions;
  }
}
