import chalk, { type ColorName } from "chalk";
import Time from "./Time";

type LogOption = {
    timeColor?: ColorName,
    timestamp?: boolean,
    logColor?: ColorName,
    txtColor?: ColorName,
}

export default class Log {
    static info(log: string | string[], option: LogOption = { timestamp: true }) {
        this.custom("INFO", log, {
            logColor: "cyanBright",
            ...option
        });
    }

    static warn(log: string | string[], option: LogOption = { timestamp: true }) {
        this.custom("WARN", log, {
            logColor: "yellowBright",
            ...option
        });
    }

    static error(log: string | string[], option: LogOption = { timestamp: true }) {
        this.custom("ERROR", log, {
            logColor: "redBright",
            ...option
        });
    }

    static custom(logType: string, log: string | string[], option: LogOption = { timestamp: true }) {
        let customLog = "";

        // タイムスタンプのカラー設定
        const timestamp = Time.getFormattedTimestamp();
        const timeColor = option?.timeColor && chalk[option?.timeColor]
            ? chalk[option?.timeColor]
            : chalk.cyan;

        if (option?.timestamp) {
            customLog += timeColor(timestamp) + chalk.blackBright(" | ");
        }

        // ログタイプのカスタマイズ
        const typeColor = option?.logColor ? chalk[option.logColor] : chalk.cyanBright;
        customLog += typeColor(logType) + chalk.blackBright(" | ");

        // メッセージのカラー設定
        const message = Array.isArray(log) ? log.join("") : log;
        const txtColor = option?.txtColor ? chalk[option.txtColor] : chalk.white;
        customLog += txtColor(message);

        // コンソールに出力
        console.log(customLog);
    }
}