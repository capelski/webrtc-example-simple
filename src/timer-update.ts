export class TimerUpdate<T> {
    public data: T[] = [];
    private timer: number = 0;

    constructor(private updateFunction: (data: T[]) => void) {}

    update(item: T) {
        this.data.push(item);
        if (this.timer) {
            clearTimeout(this.timer);
        }

        setTimeout(() => {
            this.updateFunction(this.data);
            clearTimeout(this.timer);
        }, 300);
    }
}
