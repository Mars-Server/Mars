import { config } from "../config/config";
import BedrockServer from "../core/BedrockServer";
import Log from "../modules/Log";
import YamlManager from "../modules/managers/YamlManager";
import backup from "./backup";

export default async function restart() {
    if (!BedrockServer.serverProcess) {
        Log.error("サーバーが起動していない状態で停止できません");
        return;
    }

    const isBackupStop = YamlManager.load(config.serverYmlPath, "backup/auto/stop")?.[0];

    if (isBackupStop) {
        await backup();
    }

    BedrockServer.serverProcess?.stdout?.on("data", (data) => {
        const lines: string[] = data.toString().split("\n");

        lines
            .filter(line => line.trim())
            .forEach(async line => {
                if (line.trim() === "Quit correctly") {
                    BedrockServer.end();
                    Log.info("サーバーを再起動します");
                    await BedrockServer.start();
                }
            });
    });
    BedrockServer.serverProcess?.stdin?.write("stop\n");
}