import allowlist from "../commands/allowlist";
import backup from "../commands/backup";
import kick from "../commands/kick";
import reload from "../commands/reload";
import restart from "../commands/restart";
import stop from "../commands/stop";
import transfer from "../commands/transfer";
import update from "../commands/update";
import { config } from "../config/config";
import Log from "./Log";

const commandMap: Record<string, any> = {
    backup: backup,
    reload: reload,
    restart: restart,
    stop: stop,
    update: update,
    allowlist: allowlist,
    kick: kick,
    transfer: transfer
};

export default class Command {
    static isCommand(message: string, consoleCommand: boolean = false) {
        try {
            if (consoleCommand) {
                const contents = message.split(" ");
                const name = contents.shift()!;
                const module = commandMap[name];

                if (!module) return false;
                return true;
            } else if (message.includes(config.commandPrefix)) {
                message = message.replace(config.commandPrefix, "");
                const { name, contents } = JSON.parse(message);
                const module = commandMap[name];

                if (!module) return false;
                return true;
            }

            return false;
        } catch (e: any) {
            Log.error(e.message);
            return false;
        }
    }

    static run(message: string, consoleCommand: boolean = false) {
        try {
            if (consoleCommand) {
                const contents = message.split(" ");
                const name = contents.shift()!;
                const module = commandMap[name];

                if (!module) return;

                module(contents, consoleCommand);
                return true;
            } else if (message.includes(config.commandPrefix)) {
                message = message.replace(config.commandPrefix, "");
                const { name, contents } = JSON.parse(message);
                const module = commandMap[name];

                if (!module) return;

                module(contents, consoleCommand);
            }
        } catch (e: any) {
            Log.error(e.message);
        }
    }
}