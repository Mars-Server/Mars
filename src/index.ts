import { config } from "./config/config";
import BedrockServer from "./core/BedrockServer";
import Log from "./modules/Log";

// サーバーを起動する
(async () => {
    const version = `${config.version[0]}.${config.version[1]}.${config.version[2]}`;
    Log.info(`Mars v${version}`);

    await BedrockServer.start();
})();