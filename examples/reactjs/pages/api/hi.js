import setting from "./rsa.settings";
import { RSAServer } from "@hugorodriguesqw/rsa-bridge";

export default new RSAServer(setting).gate((req, res) => {
  console.info("> ", req.body);

  req.body = req.body?.toLowerCase();
  
  if (req.body?.includes("hi") || req.body?.includes("hello")) {
    res.status(200).send("Hello from here, how are you?");
  }

  res.status(300).send("Try starting over with 'hi'");
});
