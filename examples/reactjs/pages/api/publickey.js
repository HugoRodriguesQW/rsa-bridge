import setting from "./rsa.settings";
import { RSAServer } from "rsa-bridge";

export default new RSAServer(setting).publish();
