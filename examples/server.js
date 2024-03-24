const express = require("express");
const ServerRSA = require("../dist/rsa.js").ServerRSA;

const app = express();

const rsa = new ServerRSA({
  bits: 1024,
  refuseUnencrypted: true,
  keys: {
    format: "pkcs1",
    private: `-----BEGIN RSA PRIVATE KEY-----
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
    -----END RSA PRIVATE KEY-----`,
    public: `-----BEGIN PUBLIC KEY-----
    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCMHEeN+CZiRmkSNDq4cHWH2JQC
    E83js1zA/La3ZQ+zvnwUVlEa/Xz42MX6LLm5FlQ4Arpl8hHcvznVaebTwTEO097Y
    eSp+VwwYaEoadTeMckniSY6CU6Utygdx4qD5NJM9W6cXx80DYLrSDeQ6Si/MbLe5
    4tUoaXD1T8W9+/ymbQIDAQAB
    -----END PUBLIC KEY-----`,
  },
});

app.get("/publickey", rsa.propagateKey());

app.use(rsa.handler());

app.use((req, res) => {
  res.status(400).send({
    teste: 1230,
  });
});

app.listen(4000, () => {
  console.info("> Test server running at 4000");
});
