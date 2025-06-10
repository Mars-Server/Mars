import * as fs from "fs";
import * as path from "path";

export class FileManager {
    /**
     * ファイルをコピーする
     * @param src コピー元ファイル
     * @param dest コピー先ファイル
     */
    private static copyFile(src: string, dest: string): boolean {
        try {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * フォルダをコピーする（再帰的）
     * @param src コピー元フォルダ
     * @param dest コピー先フォルダ
     * @param skipExistsNames スキップするファイルまたはフォルダ名のリスト
     */
    private static copyFolder(src: string, dest: string, skipExistsNames: string[]): boolean {
        try {
            fs.mkdirSync(dest, { recursive: true });

            const items = fs.readdirSync(src);

            for (const item of items) {
                if (skipExistsNames.includes(item)) {
                    continue;
                }

                const srcPath = path.join(src, item);
                const destPath = path.join(dest, item);
                const stat = fs.statSync(srcPath);

                if (stat.isDirectory()) {
                    this.copyFolder(srcPath, destPath, skipExistsNames);
                } else {
                    this.copyFile(srcPath, destPath);
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * ファイルを削除
     * @param filePath
     */
    public static deleteFile(filePath: string): boolean {
        try {
            fs.unlinkSync(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * ディレクトリーを削除
     * @param directoryPath
     */
    public static deleteDirectory(directoryPath: string): boolean {
        try {
            fs.rmSync(directoryPath, { recursive: true, force: true });
            return true;
        } catch {
            return false;
        }
    }

    public static exists(path: string) {
        return fs.existsSync(path);
    }

    /**
     * 指定されたディレクトリ内で特定の名前と一致するファイルやフォルダのパスを取得する
     * @param dirPath 探索するディレクトリのパス
     * @param name 探索するファイル名またはフォルダ名
     * @returns 一致したファイルやフォルダのパス、見つからなければ null
     */
    public static findPath(dirPath: string, name: string): string {
        const search = (currentDir: string): string => {
            const entries = fs.readdirSync(currentDir);

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry);
                let stat;

                try {
                    stat = fs.statSync(fullPath);
                } catch {
                    continue;
                }

                if (entry === name) {
                    return fullPath;
                }

                if (stat.isDirectory()) {
                    const result = search(fullPath);
                    if (result) return result;
                }
            }

            return "";
        };

        try {
            return search(dirPath);
        } catch (error) {
            console.error(error);
            return "";
        }
    }

    public static write(filePath: string, data: string) {
        try {
            fs.writeFileSync(filePath, data, "utf-8");
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 指定されたファイル名やフォルダ名を指定ディレクトリからのパスとしてコピーする
     * @param dirPath 探索するディレクトリのパス
     * @param names コピー対象となるファイル名、フォルダ名、またはそのパスのリスト
     * @param destinationDir コピー先のディレクトリ
     * @param skipExistsNames コピー元のディレクトリ内で、このリストに含まれるファイルやフォルダはコピーしない
     * @returns コピーが成功したか
     */
    public static copyFilesAndFolders(
        dirPath: string,
        names: string[],
        destinationDir: string,
        skipExistsNames: string[] = []
    ): boolean {
        let success = true;

        try {
            if (!fs.existsSync(destinationDir)) {
                fs.mkdirSync(destinationDir, { recursive: true });
            }
        } catch {
            return false;
        }

        for (const name of names) {
            const sourcePath = path.resolve(dirPath, name);
            const destinationPath = path.resolve(destinationDir, path.basename(name));
            const baseName = path.basename(name);

            try {
                const stat = fs.statSync(sourcePath);

                if (stat.isDirectory()) {
                    if (!this.copyFolder(sourcePath, destinationPath, skipExistsNames)) {
                        success = false;
                    }
                } else if (stat.isFile()) {
                    if (!skipExistsNames.includes(baseName)) {
                        if (!this.copyFile(sourcePath, destinationPath)) {
                            success = false;
                        }
                    }
                } else {
                    success = false;
                }
            } catch {
                success = false;
            }
        }

        return success;
    }
}