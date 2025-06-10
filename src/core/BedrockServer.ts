import * as os from "os";
import prompts from "prompts";
import { BasicVersions, PreviewVersions, serverDownloadURL } from "../config/serverDownloadURL";
import Log from "../modules/Log";
import Download from "../modules/Download";
import * as zip from "../modules/Zip";
import { FileManager } from "../modules/managers/FileManager";
import childProcess, { ChildProcess } from "child_process";
import ServerPathUtils from "../utils/ServerPathUtils";
import { ServerPackManager } from "../modules/managers/ServerPackManager";
import { compiledServerYml } from "../config/compiled-server-yml";
import { config } from "../config/config";
import YamlManager from "../modules/managers/YamlManager";
import Command from "../modules/CommandCheck";
import backup from "../commands/backup";
import readline from "readline";

export default class BedrockServer {
    public static serverProcess: ChildProcess | null;
    public static intervalId: NodeJS.Timeout;

    public static async init() {
        const folderPath = ServerPathUtils.getServerFolderPath() || "./";

        Log.info("初期化を開始します");
        await downloadServer(folderPath);
        Log.info("初期化が完了しました");
    }

    public static async start() {
        if (!ServerPathUtils.existsServerYaml(config.serverYmlPath)) {
            FileManager.write(config.serverYmlPath, compiledServerYml);
            Log.info("server.ymlを生成しました");
            Log.info("サーバーを再度起動してください");

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const waitForEnter = async (): Promise<void> => {
                return new Promise((resolve) => {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    rl.question("Enterキーを押すと終了します──\n", () => {
                        rl.close();
                        resolve();
                    });
                });
            }

            await waitForEnter();
            process.exit(0);
        }

        if (!ServerPathUtils.existsExecutable()) {
            await this.init();
        }

        if (YamlManager.load(config.serverYmlPath, "addon/auto-update")?.[0]) {
            ServerPackManager.update();
        }

        Log.info("サーバーを起動します");

        const executablePath = ServerPathUtils.getServerExecutablePath();

        if (os.platform() === "linux") {
            try {
                ServerPathUtils.chmod(executablePath);
            } catch (e) {
                Log.error("実行可能ファイルに権限を設定できませんでした");
                process.exit(0);
            }
        }

        this.serverProcess = childProcess.spawn(ServerPathUtils.getServerExecutablePath(), [], {
            stdio: ["pipe", "pipe", "pipe"]
        });

        const interval = YamlManager.load(config.serverYmlPath, "backup/auto/interval")?.[0];

        if (interval) {
            Log.info(`${interval}ごとにバックアップが実行されます`);
            this.intervalId = setInterval(async () => {
                await backup();
            }, parseInterval(interval));
        }

        process.stdin.setEncoding("utf-8");
        process.stdin.resume();
        process.stdin.on("data", async (data) => {
            const input = data.toString().trim();

            if (Command.isCommand(input, true)) {
                Command.run(input, true);
                return;
            }

            this.serverProcess?.stdin?.write(data);
        });

        // マイクラサーバーからのデータ
        this.serverProcess?.stdout?.on("data", (data) => {
            const lines = data.toString().split("\n");

            lines.forEach((line: string) => {
                if (line.trim()) {
                    let type: "info" | "warn" | "error" = "info";

                    if (line.includes("INFO")) type = "info";
                    if (line.includes("WARN")) type = "warn";
                    if (line.includes("ERROR")) type = "error";
                    if (line.indexOf("]") !== -1) {
                        line = line.slice(line.indexOf("]") + 1).trim();
                    }

                    line = line.replace("[Scripting]", "").trim();
                    Log[type](line);
                }
            });
        });

        // マイクラサーバーからのエラーデータ
        this.serverProcess?.stderr?.on("data", (data) => {
            Log.error(data.toString());
        });

        this.serverProcess.on("error", (error) => {
            Log.error(`サーバーの起動中にエラーが発生しました: ${error}`);
        });
    }

    public static end() {
        process.stdin.removeAllListeners("data");

        if (this.serverProcess) {
            this.serverProcess.stdout?.removeAllListeners("data");
            this.serverProcess.stderr?.removeAllListeners("data");
            this.serverProcess.removeAllListeners("error");
            this.serverProcess.kill();
            this.serverProcess = null;
        }

        Log.info("監視イベントを解除しました");
    }
}

function parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)(m|h|d)$/);

    if (!match) {
        throw new Error(`interval は「分（m）」「時間（h）」「日（d）」のみ対応しています: ${interval}`);
    }

    const [, numStr, unit] = match;

    if (numStr) {
        const num = parseInt(numStr, 10);

        switch (unit) {
            case "m": return num * 60 * 1000;
            case "h": return num * 60 * 60 * 1000;
            case "d": return num * 24 * 60 * 60 * 1000;
            default:
                throw new Error(`未対応の単位です: ${unit}`);
        }
    }

    return 0;
}

async function getDownloadURL(): Promise<string | null> {
    const platform = os.platform();
    const responses = await prompts([
        {
            type: "select",
            name: "type",
            message: "タイプを選択してください",
            choices: [
                { title: "preview", value: "preview" },
                { title: "basic", value: "basic" }
            ],
        },
        {
            type: "select",
            name: "version",
            message: "バージョンを選択してください",
            choices: (prev, answers) => {
                if (answers.type === "preview") {
                    return Object.keys(PreviewVersions).map(v => ({ title: v, value: v }));
                } else if (answers.type === "basic") {
                    return Object.keys(BasicVersions).map(v => ({ title: v, value: v }));
                }
                return [];
            }
        }
    ]);

    if (!responses.type || !responses.version) {
        Log.error("タイプかバージョンが選択されていません");
        process.exit(0);
    }

    let url = serverDownloadURL[responses.type];

    if (!url) return null;

    url = url
        .replaceAll("{version}", responses.version)
        .replaceAll("{os}", platform === "win32" ? "win" : platform === "linux" ? "linux" : "");

    if (!url.includes("win") && !url.includes("linux")) {
        Log.error("未対応のプラットフォームです");
        process.exit(0);
    }

    Log.info("ダウンロードURLを正常に取得しました");

    return url;
}

export async function downloadServer(folderPath: string, isExcluded: boolean = false): Promise<void> {
    const url = await getDownloadURL();

    if (!url) return;

    Log.info("サーバーのダウンロードを開始します");

    const zipFilePath = await Download(url, folderPath);

    Log.info("サーバーのダウンロードが完了しました");
    Log.info("サーバーファイルの解凍を開始します");

    const isUnZip = await zip.extract(zipFilePath, folderPath, {
        showProgressBar: true,
        excludedPaths: isExcluded ? config.excludedFolderAndFiles : []
    });

    if (isUnZip) {
        FileManager.deleteFile(zipFilePath);
        Log.info("サーバーファイルの解凍が完了しました");
    } else {
        Log.error("サーバーファイルの解凍に失敗しました");
    }
}