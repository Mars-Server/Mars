export class ProgressBar {
    private total: number;
    private received: number = 0;
    private readonly barLength: number;

    constructor(total: number, barLength = 40) {
        this.total = total;
        this.barLength = barLength;
    }

    update(chunkSize: number = 1) {
        this.received += chunkSize;
        this.render();
    }

    private render() {
        const ratio = Math.min(this.received / this.total, 1);
        const filledLength = Math.round(this.barLength * ratio);
        const emptyLength = this.barLength - filledLength;

        const green = "\x1b[42m \x1b[0m";
        const white = "\x1b[47m \x1b[0m";

        const bar = green.repeat(filledLength) + white.repeat(emptyLength);
        const percent = (ratio * 100).toFixed(1).padStart(5);

        process.stdout.write(`\r[${bar}] ${percent}%`);
    }

    finish() {
        this.received = this.total;
        this.render();
        process.stdout.write("\n");
    }
}
