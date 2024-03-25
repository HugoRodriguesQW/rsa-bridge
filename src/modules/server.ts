import Express, { Handler, Send } from "express";
import { BasicRSA, BasicRSAConfig } from "./basic";
import f from "../utils/string";

type Preserved<T> = T & { __preserved: T };

export interface ExtendedRequest extends Express.Request {
  RSA: RSAServer;
}

export class RSAServer extends BasicRSA {
  constructor(settings: BasicRSAConfig) {
    super(settings);
  }

  /** Returns an http handler responsible for exposing the public key of the RSA service */
  publish(_: any, res: any) {
    if (typeof res?.contentType === "function") res.contentType("text");
    if (typeof res?.status === "function") res.status(200);

    return res?.json({
      key: this.publicKey("public"),
      format: "public",
    });
  }

  gate(handler?: Handler): Handler {
    if (handler)
      (handler as Preserved<Handler>).__preserved = handler?.bind(handler);

    const PreservedSend = handler as Preserved<Handler>;

    return async (req, res, ...props) => {
      const clientKey = req.headers["x-client-key"];
      if (!clientKey?.length) return this.refuse(res, 400);

      req.body = await this.readRequestDataFrom(req);

      if (req.body) {
        try {
          req.body = this.decrypt(req.body);
        } catch {
          return this.refuse(res);
        }
      }

      Object.assign(req, { RSA: this });

      res.removeHeader?.("x-client-key");
      res.send = this.injectedSend(res.send.bind(res), clientKey);
      if (handler) {
        return PreservedSend.__preserved.call(handler, ...[req, res, ...props]);
      }

      if (typeof props[0] === "function") {
        return props[0]();
      }
    };
  }

  injectedSend(send: Send, key: string | string[]): Send {
    (send as Preserved<Send>).__preserved = send;
    const PreservedSend = send as Preserved<Send>;

    const utfKey = f(Array.isArray(key) ? key.join("") : key, "base64").to(
      "utf8"
    );

    return (data) => {
      try {
        const encrypted = this.encryptWithKey(utfKey, data, "public");
        return PreservedSend.__preserved.call(this, encrypted);
      } catch (err) {
        throw new Error("error injecting rsa in response " + err);
      }
    };
  }

  private readRequestDataFrom(req: Express.Request): Promise<any> {
    return new Promise((r, j) => {
      if (req.readable !== true) r(req.body);

      let data = "";

      req.on("data", (chunk) => {
        data += chunk;
      });

      req.on("error", j);
      req.on("close", j);
      req.on("end", () => r(data));
    });
  }

  private refuse(res: Express.Response, code?: number) {
    return res.status(code || 500).send("refused by rsa service");
  }
}
