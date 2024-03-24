import NodeRSA from "node-rsa";
import { BasicRSA, BasicRSAConfig } from "./basic";
import { RSARequestBody } from "./server";
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
      const headers = {
        ...options?.headers,
        "x-client-token": this.publicKey(),
      };

      const body = options?.body
        ? this.parseBody(options.body, reject)
        : undefined;

      fetch(input, {
        ...options,
        headers,
        body,
      })
        .then(async (response) => {
          try {
            const result = (await response.json()) as RSARequestBody | string;

            if (typeof result === "string") return reject(result);

            const RSAResult = (result as RSARequestBody).___RSADATA;

            if (RSAResult) {
              try {
                resolve(this.decrypt(RSAResult.toString()));
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
    this.#connectPromise = new Promise((resolve) => {
      const RSA = this;
      (function tryIt() {
        RSA.#event.emit("connecting");

        fetch(publicKeyEndpoint, options)
          .then(async (res) => {
            try {
              const node = (await res.json()) as RSAClient["serverNode"];

              if (!node?.format || !node.key) throw new Error();
              console.info({ node });

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

  private parseBody(
    body: RequestInit["body"],
    onError?: (...p: any) => void
  ): string | undefined {
    try {
      if (!this.serverNode) throw new Error("missing serverNode properties");
      return JSON.stringify({
        ___RSADATA: this.encryptWithKey(
          this.serverNode.key,
          JSON.stringify(body),
          this.serverNode.format
        ),
      } as RSARequestBody);
    } catch (err) {
      onError?.(err);
      return undefined;
    }
  }
}
