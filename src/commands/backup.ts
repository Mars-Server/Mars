import BedrockServer from "../core/BedrockServer";
import Log from "../modules/Log";
import { FileManager } from "../modules/managers/FileManager";
import PropertyManager from "../modules/managers/PropertyManager";
import YamlManager from "../modules/managers/YamlManager";
import Time from "../modules/Time";
import path from "path";
import * as zip from "../modules/Zip";
import fs from "fs";
import ServerPathUtils from "../utils/ServerPathUtils";
import { config } from "../config/config";

export default async function backup(): Promise<boolean> {
    if (!BedrockServer.serverProcess) {
        Log.error("サーバーが起動していない状態でバックアップできません");
        return false;
    }

    Log.info("サーバーのバックアップ準備を開始します");
    BedrockServer.serverProcess.stdin?.write("save hold\n");

    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            if (!BedrockServer.serverProcess) {
                Log.error("サーバーが起動していない状態でバックアップできません");
                clearInterval(intervalId);
                resolve(false);
                return;
            }

            BedrockServer.serverProcess.stdin?.write("save query\n");
        }, 500);

        const backupHandler = async (data: Buffer) => {
            const output = data.toString();

            if (!BedrockServer.serverProcess) {
                Log.error("サーバーが起動していない状態でバックアップできません");
                clearInterval(intervalId);
                resolve(false);
                return;
            }

            if (output.includes("Data saved. Files are now ready to be copied.")) {
                clearInterval(intervalId);
                BedrockServer.serverProcess.stdout?.removeListener("data", backupHandler);

                Log.info("サーバーのバックアップ準備が完了しました");
                Log.info("サーバーのバックアップを開始します");

                const result = await handleBackup();

                if (result) {
                    Log.info("バックアップが完了しました");
                } else {
                    Log.error("バックアップに失敗しました");
                }

                BedrockServer.serverProcess.stdin?.write("save resume\n");

                resolve(result);
            }
        };

        BedrockServer.serverProcess?.stdout?.on("data", backupHandler);
    });
}

async function handleBackup(): Promise<boolean> {
    const serverFolderPath = ServerPathUtils.getServerFolderPath() || "./";
    const serverProperties = PropertyManager.load(path.join(serverFolderPath, "./server.properties"));
    const levelName = serverProperties["level-name"];
    const folderName = Time.getFormattedTimestamp("YYYY_MM_DD_hh_mm_ss_SSS");
    const backupsDirPath = path.join(serverFolderPath, "./backups");

    const isCopy = FileManager.copyFilesAndFolders(
        serverFolderPath,
        ["server.properties", "allowlist.json", "config", `worlds/${levelName}`],
        path.join(backupsDirPath, folderName),
        ["behavior_packs", "resource_packs", "world_behavior_packs.json", "world_resource_packs.json"]
    );

    if (!isCopy) {
        return false;
    }

    const zipFilePath = path.join(backupsDirPath, `${folderName}.zip`);
    const result = await zip.compress(
        [path.join(backupsDirPath, folderName)],
        zipFilePath
    );

    // 圧縮失敗
    if (!result) return false;

    FileManager.deleteDirectory(path.join(backupsDirPath, folderName));

    const maxCount = YamlManager.load(config.serverYmlPath, "backup/max-count")?.[0];

    if (!Number.isInteger(maxCount) || maxCount < 1) {
        Log.error(`backupのmax-countは1以上の整数でないといけません。指定された値: ${maxCount}`);
        return false;
    }

    const backupDirs = fs.readdirSync(backupsDirPath)
        .filter((fileName) => fs.statSync(path.join(backupsDirPath, fileName)).isDirectory())
        .map(fileName => ({
            name: fileName,
            time: fs.statSync(path.join(backupsDirPath, fileName)).mtime.getTime()
        }))
        .sort((a, b) => a.time - b.time);

    if (backupDirs.length > maxCount) {
        const excessBackups = backupDirs.slice(0, backupDirs.length - maxCount);

        for (const backup of excessBackups) {
            const backupPath = path.join(backupsDirPath, backup.name);
            const isDelete = FileManager.deleteDirectory(backupPath);

            if (isDelete) {
                Log.info(`古いバックアップを削除しました: ${backupPath}`);
            }
        }
    }

    return true;
}
