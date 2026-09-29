import { config } from '../core/config';
import { Client} from "@frejun/teler";

export const telerClient = new Client(config.telerKey);