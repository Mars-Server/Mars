import os from "os";
import fs from "fs";
import path from "path";
import { FileManager } from "../modules/managers/FileManager";
import YamlManager from "../modules/managers/YamlManager";
import { config } from "../config/config";

export default class ServerPathUtils {
    static getServerFolderPath(): string | undefined {
        const datas = YamlManager.load(config.serverYmlPath, "server-folder")?.[0];

        if (!datas || datas[0] === null) return;
        return datas;
    }

    static getServerExecutablePath(): string {
        const platform = os.platform();
        const serverFolderPath = this.getServerFolderPath() || "./";

        return path.join(serverFolderPath, platform === "win32" ? "bedrock_server.exe" : "bedrock_server");
    }

    static existsExecutable(): boolean {
        return FileManager.exists(this.getServerExecutablePath());
    }

    static existsServerYaml(path: string): boolean {
        return FileManager.exists(path);
    }

    static chmod(path: string) {
        fs.chmodSync(path, 0o755);
    }
}