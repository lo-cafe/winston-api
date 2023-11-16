import {expressServer} from "./webserver";
import dotenv from "dotenv"

dotenv.config({ path: "data/.env"});
expressServer(process.env.BEARER ?? "")