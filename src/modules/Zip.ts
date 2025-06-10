import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import archiver from "archiver";
import { ProgressBar } from "./ProgressBar";

type ZipOptions = {
    showProgressBar?: boolean;
    excludedPaths?: string[];
}

/**
 * zipを解凍する
 * @param zipFilePath zipファイルのパス
 * @param outdirPath 出力先ディレクトリのパス
 * @param options 表示オプション（showProgressBar）
 */
export async function extract(zipFilePath: string, outdirPath: string, options: ZipOptions = {}): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            const excludedPaths = options.excludedPaths ?? [];
            const resolvedOutdirPath = path.resolve(outdirPath);

            // 安全なパス確認
            if (!fs.existsSync(resolvedOutdirPath)) {
                fs.mkdirSync(resolvedOutdirPath, { recursive: true });
            }

            const directory = await unzipper.Open.file(zipFilePath);
            const total = directory.files.length;
            const progress = options.showProgressBar ? new ProgressBar(total) : null;

            for (const file of directory.files) {
                const isExcluded = excludedPaths.some(excluded => file.path.startsWith(excluded));
                const outPath = path.join(resolvedOutdirPath, file.path);

                // スキップ条件
                if (isExcluded && fs.existsSync(outPath)) {
                    progress?.update();
                    continue;
                }

                const parentDir = path.dirname(outPath);
                if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                }

                if (file.type === "Directory") {
                    fs.mkdirSync(outPath, { recursive: true });
                } else {
                    await new Promise<void>((res, rej) => {
                        file.stream()
                            .pipe(fs.createWriteStream(outPath))
                            .on("finish", () => res())
                            .on("error", (err) => rej(err));
                    });
                }

                progress?.update();
            }

            progress?.finish();
            resolve(true);
        } catch (error) {
            console.error("解凍エラー:", error);
            reject(error);
        }
    });
}

/**
 * フォルダーまたはファイルをzip化する
 * @param paths 圧縮対象のファイル・フォルダーのパス配列
 * @param outZipPath 出力するzipファイルのパス
 * @param options 表示オプション（showProgressBar）
 */
export async function compress(paths: string[], outZipPath: string, options: ZipOptions = {}): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const outDir = path.dirname(outZipPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const output = fs.createWriteStream(outZipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        const totalItems = paths.length;
        let addedItems = 0;
        const progress = options.showProgressBar ? new ProgressBar(totalItems) : null;

        output.on("close", () => {
            progress?.finish();
            resolve(true);
        });

        archive.on("warning", (err) => {
            console.warn(err);
        });

        archive.on("error", (err) => reject(err));

        archive.pipe(output);

        for (const item of paths) {
            const baseName = path.basename(item);
            if (fs.lstatSync(item).isDirectory()) {
                archive.directory(item, baseName);
            } else {
                archive.file(item, { name: baseName });
            }
            addedItems++;
            progress?.update();
        }

        archive.finalize();
    });
}

export function isZipFile(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return false;
    const buffer = fs.readFileSync(filePath);
    return buffer.length > 4 && buffer.readUInt16LE(0) === 0x4b50; // 'PK'
}
