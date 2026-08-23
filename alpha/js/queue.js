class Queue {
    constructor(interval = 1000) {
        this.interval = interval;
        this.lastExecutionTime = 0;
        this.queue = [];
        this.workingOnPromise = false;
    }

    enqueue(func) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                func,
                resolve,
                reject,
            });
            this.dequeue();
        });
    }

    dequeue() {
        if (this.workingOnPromise || this.queue.length === 0) {
            return false;
        }
        const item = this.queue.shift();
        if (!item) {
            return false;
        }

        try {
            this.workingOnPromise = true;
            const currentInterval = this.interval - (Date.now() - this.lastExecutionTime);
            setTimeout(() => {
                Promise.resolve(item.func())
                    .then((value) => {
                        this.workingOnPromise = false;
                        this.lastExecutionTime = Date.now();
                        this.dequeue();
                        item.resolve(value);
                    })
                    .catch(err => {
                        this.workingOnPromise = false;
                        this.lastExecutionTime = Date.now();
                        this.dequeue();
                        item.reject(err);
                    });
            }, Math.max(currentInterval, 0));
        } catch (err) {
            this.workingOnPromise = false;
            this.dequeue();
            item.reject(err);
        }
        return true;
    }
}