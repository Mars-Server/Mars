import os from "os";
import fs from "fs";
import path from "path";
import { FileManager } from "../modules/managers/FileManager";
import YamlManager from "../modules/managers/YamlManager";
import { config } from "../config/config";

export default class ServerPathUtils {
    static getServerFolderPath(): string {
        const datas = YamlManager.load(config.serverYmlPath, "server-folder")?.[0];

        if (!datas || datas[0] === null) return "./";
        return datas;
    }

    static getServerExecutable(): string {
        const platform = os.platform();

        return platform === "win32" ? "./bedrock_server.exe" : "./bedrock_server";
    }

    static getServerExecutablePath(): string {
        const serverFolderPath = this.getServerFolderPath();
        const executablePath = path.join(serverFolderPath, this.getServerExecutable());

        return executablePath;
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

    static isPermission(path: string) {
        const stat = fs.statSync(path);
        return (stat.mode & 0o111) !== 0;
    }
}