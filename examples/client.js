import { ClientRSA } from "../dist/rsa";

const rsa = new ClientRSA({ bits: 1024 });
rsa.connect();

rsa.fetch("endpoint-to-fetch");