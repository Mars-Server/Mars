import https from "https";
import http from "http";
import { URL } from "url";
import { createWriteStream, exists, existsSync, mkdirSync } from "fs";
import { basename, join, resolve } from "path";
import { ProgressBar } from "./ProgressBar";

/**
 * URLからファイルをダウンロードして指定ディレクトリに保存
 * @param url ダウンロードURL
 * @param outputDir 保存先ディレクトリ
 * @returns 保存されたファイルのパス
 */
export default async function Download(url: string, outputDir: string): Promise<string> {
    const parsedUrl = new URL(url);
    const get = parsedUrl.protocol === "https:" ? https.get : http.get;
    const resolvedOutputDir = resolve(outputDir);
    const fileName = basename(parsedUrl.pathname);
    const outputPath = join(resolvedOutputDir, fileName);

    // ディレクトリがなければ作成
    if (!existsSync(resolvedOutputDir)) {
        mkdirSync(resolvedOutputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Download failed: ${res.statusCode}`));
                return;
            }

            const total = parseInt(res.headers["content-length"] || "0", 10);
            const progress = total > 0 ? new ProgressBar(total) : null;
            let received = 0;
            const fileStream = createWriteStream(outputPath);

            res.on("data", (chunk) => {
                received += chunk.length;
                fileStream.write(chunk);
                progress?.update(chunk.length);
            });

            res.on("end", () => {
                fileStream.end();
                progress?.finish();
                resolve(outputPath);
            });


            res.on("error", (err) => {
                fileStream.close();
                reject(err);
            });
        }).on("error", reject);
    });
}
