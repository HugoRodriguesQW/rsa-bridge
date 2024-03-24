import Express, { Send } from "express";
import { BasicRSA, BasicRSAConfig } from "./basic";

interface RSAServerConfig extends BasicRSAConfig {
  allowUnencryptedIn?: boolean;
}

type DefaultHandler = (req: any, res: any, ...unused: any) => any;

interface CustomHttpSend extends Send {
  ___preserved: Send;
}

export type RSARequestBody = {
  ___RSADATA: RequestInit["body"];
};

export class RSAServer extends BasicRSA {
  allowUnencryptedIn: boolean;

  constructor(settings: RSAServerConfig) {
    super(settings);
    this.allowUnencryptedIn = settings.allowUnencryptedIn || false;
  }

  publish(): DefaultHandler {
    return (_, res: Express.Response) => {
      if (typeof res.contentType === "function") res.contentType("text");
      if (typeof res.status === "function") res.status(200);

      return res.json({
        key: this.publicKey("public"),
        format: "public",
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

        const ___RSADATA = (req.body as RSARequestBody)?.___RSADATA;
        const ___CLIENTKEY = req.headers["x-client-token"] as string;

        if (!___CLIENTKEY.length) {
          return refuseOrNext(true);
        }

        const wrapSend = (send: CustomHttpSend, RSA: RSAServer) => {
          send.___preserved = send;

          return (data: any) => {
            try {
              const encrypted = RSA.encryptWithKey(
                ___CLIENTKEY,
                typeof data === "string" ? data : JSON.stringify(data)
              );

              return send.___preserved.call(
                RSA,
                JSON.stringify({
                  ___RSADATA: encrypted,
                })
              );
            } catch (err) {
              res.status(500);
              return send.___preserved.call(
                RSA,
                "Error trying to encrypt response data"
              );
            }
          };
        };

        (res.send as any) = wrapSend(res.send.bind(res) as CustomHttpSend, RSA);

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
