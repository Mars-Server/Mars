import BedrockServer from "../core/BedrockServer";
import Log from "../modules/Log";

export default function kick(contents: any, consoleCommand: boolean) {
    if (!contents) {
        Log.error("Usage: kick <playerName: string> <reason: string>");
        return;
    }

    const [playerName, reason] = consoleCommand
        ? contents
        : [contents.playerName, contents.reason];

    if (
        !playerName || !reason ||
        typeof playerName !== "string" ||
        typeof reason !== "string" ||
        playerName.trim() === "" ||
        reason.trim() === ""
    ) {
        Log.error("Usage: kick <playerName: string> <reason: string>");
        return true;
    }

    try {
        if (!BedrockServer.serverProcess) {
            Log.error("サーバーが起動していない状態でプレイヤーをキックできません");
            return;
        }

        BedrockServer.serverProcess?.stdin?.write(`kick ${playerName} ${reason}\n`);
    } catch (error) {
        console.error(error);
    }
}