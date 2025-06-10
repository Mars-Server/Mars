export default class Time {
    /**
     * フォーマット指定で日時文字列を返す
     * 使えるトークン例:
     * YYYY: 年(4桁)
     * MM: 月(2桁)
     * DD: 日(2桁)
     * hh: 時(2桁)
     * mm: 分(2桁)
     * ss: 秒(2桁)
     * SSS: ミリ秒(3桁)
     * 
     * @param format 
     */
    public static getFormattedTimestamp(format = "YYYY-MM-DD hh:mm:ss:SSS"): string {
        const now = new Date();
        const map: Record<string, string> = {
            "YYYY": now.getFullYear().toString(),
            "MM": String(now.getMonth() + 1).padStart(2, "0"),
            "DD": String(now.getDate()).padStart(2, "0"),
            "hh": String(now.getHours()).padStart(2, "0"),
            "mm": String(now.getMinutes()).padStart(2, "0"),
            "ss": String(now.getSeconds()).padStart(2, "0"),
            "SSS": String(now.getMilliseconds()).padStart(3, "0"),
        };
        let result = format;

        for (const key in map) {
            if (!map[key]) continue;

            result = result.replace(new RegExp(key, "g"), map[key]);
        }

        return result;
    }
}
