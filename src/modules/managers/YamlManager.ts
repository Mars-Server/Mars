import * as fs from "fs";
import * as yaml from "js-yaml";
import Log from "../Log";

export default class YamlManager {
    static loadAll(filePath: string): unknown[] | null {
        try {
            if (!fs.existsSync(filePath)) {
                Log.error("Yamlファイルの読み込みに失敗しました");
                return null;
            }

            const fileContents = fs.readFileSync(filePath, "utf-8");
            const datas = yaml.loadAll(fileContents);

            if (Array.isArray(datas) && datas.length > 0) {
                return datas;
            }
        } catch { }

        Log.error("Yamlファイルの読み込みに失敗しました");
        return null;
    }

    static load(filePath: string, propPath: string) {
        const propPaths = propPath.split("/");
        const datas = this.loadAll(filePath);

        if (!datas) return null;

        const results = [];

        for (const data of datas) {
            let current: any = data;
            for (const key of propPaths) {
                if (current && typeof current === "object" && key in current) {
                    current = current[key];
                } else {
                    current = undefined;
                    break;
                }
            }

            if (current !== undefined) {
                results.push(current);
            }
        }

        return results.length > 0 ? results : null;
    }
}