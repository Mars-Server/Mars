import BedrockServer from "../core/BedrockServer";
import Log from "../modules/Log";

export default function reload() {
    if (!BedrockServer.serverProcess) {
        Log.error("サーバーが起動していない状態で停止できません");
        return;
    }

    Log.info("サーバーをリロードします");
    BedrockServer.serverProcess?.stdin?.write("reload\n");
}