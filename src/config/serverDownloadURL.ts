export enum OsType {
    windows = "windows",
    linux = "linux"
}

export enum BasicVersions {
    "1.21.84.1" = "1.21.84.1",
    "1.21.92.1" = "1.21.92.1"
}

export enum PreviewVersions {
    "1.21.90.28" = "1.21.90.28",
    "1.21.100.22" = "1.21.100.22"
}

export const serverDownloadURL: Record<string, string> = {
    basic: "https://www.minecraft.net/bedrockdedicatedserver/bin-{os}/bedrock-server-{version}.zip",
    preview: "https://www.minecraft.net/bedrockdedicatedserver/bin-{os}-preview/bedrock-server-{version}.zip"
};