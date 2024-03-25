import setting from "./rsa.settings";
import { RSAServer } from "@hugorodriguesqw/rsa-bridge";

export default new RSAServer(setting).publish();
