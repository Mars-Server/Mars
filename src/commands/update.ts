import BedrockServer, { downloadServer } from "../core/BedrockServer";
import Log from "../modules/Log";
import ServerPathUtils from "../utils/ServerPathUtils";

export default async function update() {
    if (!BedrockServer.serverProcess) {
        Log.error("サーバーが起動していない状態でアップデートできません");
        return;
    }

    BedrockServer.serverProcess?.stdout?.on("data", (data) => {
        const lines: string[] = data.toString().split("\n");

        lines
            .filter(line => line.trim())
            .forEach(async line => {
                if (line.trim() === "Quit correctly") {
                    BedrockServer.end();
                    const folderPath = ServerPathUtils.getServerFolderPath() || "./";
                    Log.info("アップデートを開始します");
                    await downloadServer(folderPath);
                    Log.info("アップデートが完了しました");
                    await BedrockServer.start();
                }
            });
    });
    BedrockServer.serverProcess?.stdin?.write("stop\n");
}