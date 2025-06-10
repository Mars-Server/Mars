import fs from "fs";
import PropertyManager from "./PropertyManager";
import ServerPathUtils from "../../utils/ServerPathUtils";
import path from "path";
import { FileManager } from "./FileManager";
import Log from "../Log";
import YamlManager from "./YamlManager";
import { config } from "../../config/config";

export class ServerPackManager {
    public static update(): void {
        try {
            const serverFolderPath = ServerPathUtils.getServerFolderPath() || "./bedrock_server";
            const serverProperties = PropertyManager.load(path.join(serverFolderPath, "./server.properties"));
            const levelName = serverProperties["level-name"];

            const isBehaviorPacks = YamlManager.load(config.serverYmlPath, "addon/auto-update/behavior_packs")?.[0];
            const isResourcePacks = YamlManager.load(config.serverYmlPath, "addon/auto-update/resource_packs")?.[0];

            if (isBehaviorPacks) {
                this.behavior_update(serverFolderPath, levelName);
            }

            if (isResourcePacks) {
                this.resource_update(serverFolderPath, levelName);
            }
        } catch { }
    }

    private static behavior_update(serverFolderPath: string, levelName: string): void {
        Log.info("behavior_packs.jsonを更新します");

        const developmentBehaviorPacksPath = FileManager.findPath(serverFolderPath, "development_behavior_packs");
        const behaviorPacksPath = path.join(serverFolderPath, `worlds/${levelName}/behavior_packs`);
        const behaviorPacksJsonPath = path.join(serverFolderPath, `worlds/${levelName}/world_behavior_packs.json`);
        const behavior_packsJson = [];

        behavior_packsJson.push(...this.updatePacksJson(developmentBehaviorPacksPath));
        behavior_packsJson.push(...this.updatePacksJson(behaviorPacksPath));

        fs.writeFileSync(behaviorPacksJsonPath, JSON.stringify(behavior_packsJson, null, 2), "utf-8");

        Log.info("behavior_packs.jsonを更新しました");
    }

    private static resource_update(serverFolderPath: string, levelName: string): void {
        Log.info("resource_packs.jsonを更新します");

        const developmentResourcePacksPath = FileManager.findPath(serverFolderPath, "development_resource_packs");
        const resourcePacksPath = path.join(serverFolderPath, `worlds/${levelName}/resource_packs`);
        const resourcePacksJsonPath = path.join(serverFolderPath, `worlds/${levelName}/world_resource_packs.json`);
        const resource_packsJson = [];

        resource_packsJson.push(...this.updatePacksJson(developmentResourcePacksPath));
        resource_packsJson.push(...this.updatePacksJson(resourcePacksPath));

        fs.writeFileSync(resourcePacksJsonPath, JSON.stringify(resource_packsJson, null, 2), "utf-8");

        Log.info("resource_packs.jsonを更新しました");
    }

    /**
     * パックをアップデートする
     * @param dirPath 
     */
    private static updatePacksJson(dirPath: string): any[] {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const dir = fs.readdirSync(dirPath, "utf-8");
        let packsJson = [];

        for (const file of dir) {
            const filePath = `${dirPath}/${file}`;
            const manifestPath = `${filePath}/manifest.json`;

            if (!fs.existsSync(manifestPath)) continue;

            const manifestString = fs.readFileSync(manifestPath, "utf-8");
            const manifest = JSON.parse(manifestString);

            const uuid = manifest.header.uuid;
            const version = manifest.header.version;

            packsJson.push({
                "pack_id": uuid,
                "version": version
            });
        }

        return packsJson;
    }
}