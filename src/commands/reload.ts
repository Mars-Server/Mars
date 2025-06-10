import { config } from "../config/config";
import BedrockServer from "../core/BedrockServer";
import Log from "../modules/Log";
import { ServerPackManager } from "../modules/managers/ServerPackManager";
import YamlManager from "../modules/managers/YamlManager";

export default function reload() {
    if (!BedrockServer.serverProcess) {
        Log.error("サーバーが起動していない状態で停止できません");
        return;
    }

    Log.info("サーバーをリロードします");

    if (YamlManager.load(config.serverYmlPath, "addon/auto-update")?.[0]) {
        ServerPackManager.update();
    }

    BedrockServer.serverProcess?.stdin?.write("reload\n");
}