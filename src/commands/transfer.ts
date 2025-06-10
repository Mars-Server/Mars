import BedrockServer from "../core/BedrockServer";
import Log from "../modules/Log";

export default function transfer(contents: any, consoleCommand: boolean) {
    if (!contents) {
        Log.error("Usage: transfer <PlayerName: string> <host: string> <port: number>");
        return;
    }

    const [playerName, host, port] = consoleCommand
        ? contents
        : [contents.playerName, contents.host, contents.port];

    if (
        !playerName || !host || !port ||
        typeof playerName !== "string" ||
        typeof host !== "string" ||
        (typeof port !== "string" && typeof port !== "number") ||
        playerName.trim() === "" ||
        host.trim() === "" ||
        port.toString().trim() === "" ||
        Number.isNaN(Number(port))
    ) {
        Log.error("Usage: transfer <PlayerName: string> <host: string> <port: number>");
        return true;
    }

    try {
        if (!BedrockServer.serverProcess) {
            Log.error("サーバーが起動していない状態でプレイヤーを転送できません");
            return;
        }

        BedrockServer.serverProcess?.stdin?.write(`transfer ${playerName.trim()} ${host.trim()} ${Number(port)}\n`);
    } catch (error) {
        console.error(error);
    }
}