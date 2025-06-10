import * as fs from "fs";

export default class PropertyManager {
    /**
     * propertiesファイル
     */
    public static load(path: string): any {
        try {
            const data = fs.readFileSync(path, "utf-8");
            const lines = data.split("\n");
            const properties: any = {};

            for (let line of lines) {
                const trimmedLine = line.trim();

                if (trimmedLine.startsWith("#") || trimmedLine === "") continue;

                const [key, ...value] = trimmedLine.split("=");
                const trimmedValue = value.join("=").trim();
                let result;

                if (trimmedValue) {
                    if (Number.isNaN(parseFloat(trimmedValue))) {
                        if (trimmedValue === "true") {
                            result = true;
                        } else if (trimmedValue === "false") {
                            result = false;
                        } else {
                            result = trimmedValue;
                        }
                    } else {
                        result = parseFloat(trimmedValue);
                    }
                } else {
                    result = trimmedValue;
                }

                if (key) {
                    properties[key.trim()] = result;
                }
            }

            return properties;
        } catch (error) {
            throw new Error(`${path}が見つかりませんでした`);
        }
    }
}