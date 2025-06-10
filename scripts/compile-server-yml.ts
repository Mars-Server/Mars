import * as fs from "fs";
import * as path from "path";

// src/assets/def-server-yml.ts

const serverYmlPath = path.resolve("./assets/server.yml");
const outPath = path.resolve("src", "config", "compiled-server-yml.ts");

if (!fs.existsSync(serverYmlPath)) {
    throw new Error("server.ymlが見つかりませんでした");
}

const content = fs.readFileSync(serverYmlPath, "utf-8");

const tsCode = `
// AUTO-GENERATED. DO NOT EDIT.
export const compiledServerYml = ${JSON.stringify(content)}
`;

fs.writeFileSync(outPath, tsCode, "utf-8");
console.log("compiled-server-yml.tsを生成しました");