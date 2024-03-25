import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import { BasicRSA } from "../modules/basic";
import { RSAServer } from "../modules/server";

chai.use(chaiAsPromised);

const anotherRSA = new BasicRSA({ bits: 1024 });

const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCMHEeN+CZiRmkSNDq4cHWH2JQC
E83js1zA/La3ZQ+zvnwUVlEa/Xz42MX6LLm5FlQ4Arpl8hHcvznVaebTwTEO097Y
eSp+VwwYaEoadTeMckniSY6CU6Utygdx4qD5NJM9W6cXx80DYLrSDeQ6Si/MbLe5
4tUoaXD1T8W9+/ymbQIDAQAB
-----END PUBLIC KEY-----`;

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQCMHEeN+CZiRmkSNDq4cHWH2JQCE83js1zA/La3ZQ+zvnwUVlEa
/Xz42MX6LLm5FlQ4Arpl8hHcvznVaebTwTEO097YeSp+VwwYaEoadTeMckniSY6C
U6Utygdx4qD5NJM9W6cXx80DYLrSDeQ6Si/MbLe54tUoaXD1T8W9+/ymbQIDAQAB
AoGAYlGx8LETFmF8d/bIwgbAovxbGH4XO9Lwoshz24wCkcp4vbi4n20EVoefnefm
yDggD1HyxXkyCarzBYyUG0J1jn1CQCVeVYHIMLA23DqjmXdJVyfdolXoiRgcu4t+
nPhasUWTcaTvZK6DFQJVhdVy4kJtiZ1l6E76zdpAUFKU7YECQQDCK9hvCAe+pn6S
D0Utm3DHu8Hd5rEJ4e3RH70M4fuBNE0XSkzCBOFmgtxwayD/wXdgP6KJ9byjtYPC
wvIqnJyhAkEAuLmWtLaYasC73OarhbM1au+pR06hEVL9Qlh1b665FP5Id66b5OId
Kx89tfOmp0V9+OSG/uuDXp9VWx9h/LtKTQJBAJsMP+uJUgXfFTq0jtz4Pnp/ZzM2
PzBRBIH1AhUDbr2hcd2jKt/S3dnprPTn1pXjetuUdMoNO/DNxMUEvjNgk4ECQQCS
TpP5z8GKk9p3jM9/VsBRUT7O9o0Fzqg+mxdwfH+lC/3TpR1ePGUD2XukGDX/uD+d
GUt+roRfNm2Bfaq7ZI/lAkBgNfAHagCukY+mYvHOTZ155jpbaNRVTq1cDsLAgrw4
wAmgpatk9EoWaYd1yFGFEAdGJhE4NuZN+S0dZoccvusW
-----END RSA PRIVATE KEY-----`;

describe("BasicRSA Validation", () => {
  describe("Validation with random keys", () => {
    const memory: any = {};

    it("create with default config", () => {
      const rsa = new BasicRSA();
      expect(rsa).not.to.be.equal(null).equal(undefined);
      expect(rsa.keyFormats.private).to.be.equal("private");
      expect(rsa.keyFormats.public).to.be.equal("public");
      expect(rsa.encoder.isPublic()).to.be.equal(true);
      expect(rsa.decoder.isPrivate()).to.be.equal(true);
      memory.rsa = rsa;
    });

    it("create instance with random keys", () => {
      const rsa = new BasicRSA({ bits: 1024 });
      expect(rsa).not.to.be.equal(null).equal(undefined);
      expect(rsa.keyFormats.private).to.be.equal("private");
      expect(rsa.keyFormats.public).to.be.equal("public");
      expect(rsa.encoder.isPublic()).to.be.equal(true);
      expect(rsa.decoder.isPrivate()).to.be.equal(true);
      memory.rsa = rsa;
    });

    it("encrypt using public key", () => {
      const rsa: BasicRSA = memory.rsa;
      memory.text = "my cat is funny";
      memory.text1 = rsa.encrypt(memory.text);
      expect(memory.text1).to.be.an("string");
    });

    it("decrypt using private key", () => {
      const rsa: BasicRSA = memory.rsa;
      const target = memory.text;
      const encrypted = memory.text1;
      memory.text2 = rsa.decrypt(encrypted);
      expect(memory.text2).to.be.equal(target);
    });

    it("encrypt using public key on another", () => {
      const rsa: BasicRSA = memory.rsa;
      const target = memory.text;
      const encrypted = anotherRSA.encryptWithKey(rsa.publicKey(), target);
      expect(rsa.decrypt(encrypted)).to.be.eq(target);
    });
  });

  describe("Validation with custom  keys", () => {
    const memory: any = {};
    it("create instance with random keys", () => {
      const rsa = new BasicRSA({
        keys: {
          private: privateKey,
          public: publicKey,
        },
      });
      expect(rsa).not.to.be.equal(null).equal(undefined);
      expect(rsa.keyFormats.private).to.be.equal("private");
      expect(rsa.keyFormats.public).to.be.equal("public");
      expect(rsa.encoder.isPublic()).to.be.equal(true);
      expect(rsa.decoder.isPrivate()).to.be.equal(true);
      memory.rsa = rsa;
    });

    it("encryp using public key", () => {
      const rsa: BasicRSA = memory.rsa;
      memory.text = "my cat is funny";
      memory.text1 = rsa.encrypt(memory.text);
      expect(memory.text1).to.be.an("string");
    });

    it("decrypt using private key", () => {
      const rsa: BasicRSA = memory.rsa;
      const target = memory.text;
      const encrypted = memory.text1;
      memory.text2 = rsa.decrypt(encrypted);
      expect(memory.text2).to.be.equal(target);
    });

    it("encrypt using public key on ", () => {
      const rsa: BasicRSA = memory.rsa;
      const target = memory.text;
      const encrypted = anotherRSA.encryptWithKey(rsa.publicKey(), target);
      expect(rsa.decrypt(encrypted)).to.be.eq(target);
    });
  });

  describe("Validation with invalid inputs", () => {
    it("invalid constructor config", () => {
      try {
        // @ts-ignore
        new BasicRSA({ bits: 1023 });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }
    });

    it("invalid constructor keys", () => {
      try {
        // @ts-ignore
        new BasicRSA({
          keys: {
            public: "invalid-key",
            private: "invalid-key",
          },
        });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }
    });

    it("invalid encrypt input", () => {
      try {
        // @ts-ignore
        anotherRSA.encrypt({ invalid: true });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }
    });

    it("invalid decrypt input", () => {
      try {
        // @ts-ignore
        anotherRSA.decrypt({ invalid: true });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }
    });

    it("invalid decrypt input", () => {
      try {
        // @ts-ignore
        anotherRSA.decrypt({ invalid: true });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }
    });

    it("missing private/public key", () => {
      try {
        new BasicRSA({
          // @ts-ignore
          keys: {
            public: publicKey,
          },
        });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }

      try {
        new BasicRSA({
          // @ts-ignore
          keys: {
            private: privateKey,
          },
        });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }
    });

    it("missing private/public key format", () => {
      try {
        new BasicRSA({
          keys: {
            public: publicKey,
            private: privateKey,
            // @ts-ignore
            format: {
              public: "public",
            },
          },
        });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }

      try {
        new BasicRSA({
          keys: {
            private: privateKey,
            public: publicKey,
            // @ts-ignore
            format: {
              private: "private",
            },
          },
        });
        expect.fail();
      } catch (err) {
        expect(err).not.be.eq(undefined).eq(null);
      }
    });
  });
});

describe("Server Validation", () => {
  const memory: any = {};
  it("create server instance", () => {
    const rsa = new RSAServer({
      keys: { private: privateKey, public: publicKey },
    });
    memory.rsa = rsa;
  });

  it("testing public key handle", () => {
    const rsa: RSAServer = memory.rsa;

    function send(data: string) {
      const result = JSON.parse(data);
      expect(result.key).to.be.equal(rsa.publicKey());
      expect(result.format).to.be.equal("public");
    }

    function json(data: any) {
      send(JSON.stringify(data));
    }

    rsa.publish(null, {
      json,
      send,
    });
  });
});
