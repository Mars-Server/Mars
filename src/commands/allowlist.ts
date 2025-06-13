import BedrockServer from "../core/BedrockServer";
import Log from "../modules/Log";
import { FileManager } from "../modules/managers/FileManager";
import ServerPathUtils from "../utils/ServerPathUtils";
import fs from "fs";

export default function allowlist(contents: any, consoleCommand: boolean) {
    if (consoleCommand) return;

    if (!BedrockServer.serverProcess) {
        Log.error("サーバーが起動していない状態でバックアップできません");
        return;
    }

    if (!contents) {
        Log.error("Usage: allowlist <add | remove> <playerName: string> <igLimit: boolean>");
        return;
    }

    const { type, playerName, igLimit } = contents;

    if (
        !type ||
        !playerName ||
        typeof type !== "string" ||
        !(type === "add" || type === "remove") ||
        typeof playerName !== "string" ||
        playerName.trim() === ""
    ) {
        Log.error("Usage: allowlist <add | remove> <playerName: string> <igLimit: boolean>");
        return;
    }

    try {
        const serverFolderPath = ServerPathUtils.getServerFolderPath();
        const allowlistPath = FileManager.findPath(serverFolderPath, "allowlist.json");

        if (allowlistPath) {
            const allowlist: any[] = JSON.parse(fs.readFileSync(allowlistPath, "utf-8")) || [];

            switch (type) {
                case "add":
                    if (allowlist.find(v => v.name === playerName)) return;

                    allowlist.push({
                        ignoresPlayerLimit: igLimit,
                        name: playerName
                    });
                    fs.writeFileSync(allowlistPath, JSON.stringify(allowlist));
                    Log.info(`${playerName} をallowlistに追加しました`);
                    break;

                case "remove":
                    if (!allowlist.find(v => v.name === playerName)) return;

                    const index = allowlist.findIndex(v => v.name === playerName);

                    allowlist.splice(index, 1);
                    fs.writeFileSync(allowlistPath, JSON.stringify(allowlist));
                    Log.info(`${playerName} をallowlistから削除しました`);
                    break;
            }
        }
    } catch (error) {
        console.error(error);
    }
}