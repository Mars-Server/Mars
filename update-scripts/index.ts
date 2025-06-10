// githubReleaseDownloader.ts
import { writeFile } from "fs/promises";

const owner = "Mars-Server";                 // GitHubユーザー名
const repo = "Mars";                 // リポジトリ名
const targetAssetName = "mars.exe";  // ダウンロード対象のアセット名

const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "bun-fetch",
    // 必要に応じてトークンを使う（rate limit緩和）
    // "Authorization": `Bearer ${GITHUB_TOKEN}`
};

async function downloadLatestReleaseAsset() {
    const apiUrl = `https://github.com/Mars-Server/Mars/releases/latest`;

    const res = await fetch(apiUrl, { headers });
    if (!res.ok) throw new Error(`リリース情報の取得に失敗: ${res.status}`);

    const release = await res.json();

    const asset = release.assets.find((a: any) => a.name === targetAssetName);
    if (!asset) throw new Error(`アセット ${targetAssetName} が見つかりません`);

    const assetRes = await fetch(asset.browser_download_url);
    if (!assetRes.ok) throw new Error(`アセットのダウンロードに失敗: ${assetRes.status}`);

    const buffer = await assetRes.arrayBuffer();
    await writeFile(`./${targetAssetName}`, Buffer.from(buffer));
    console.log(`✅ ${targetAssetName} を保存しました`);
}

downloadLatestReleaseAsset().catch(err => {
    console.error("❌ エラー:", err.message);
});
