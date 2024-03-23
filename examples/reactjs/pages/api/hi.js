import { ServerRSA } from "@hugorodriguesqw/rsa-bridge";
import rsaSettings from "./rsa.settings";

const rsa = new ServerRSA(rsaSettings);

export default function handler(req, res) {

  console.info("receiving a request", req.body)

  res.send(200)
}
