// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { ServerRSA } from "@hugorodriguesqw/rsa-bridge";
import rsaSettings from "./rsa.settings";

const rsa = new ServerRSA(rsaSettings);
export default rsa.propagateKey();
