// Loader class, with queue manager

const MAX_JOBS = 3;

export class Loader {

    private queue: {(): void; }[];
    private pending: { [propName: string]: boolean; }

    constructor() {

        // Queue of URLs
        this.queue = [];

        // Pending requests
        this.pending = {};

        setTimeout(this.tick.bind(this), 17);
    }

    load(url: string) {

        // Push onto queue and wait for resolve
        return new Promise((resolve) => {
            this.queue.push(resolve);
        }).then(() => {
            if (url in this.pending) {
                return Promise.reject(new Error("Already loading, abort"))
            }
            this.pending[url] = true;
            return fetch(url);
        }).then((response) => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Response was not OK');
        }).then((text) => {
            delete this.pending[url];
            return JSON.parse(text);
        }).catch((error) => {
            delete this.pending[url];
            throw error;
        });

    }

    // Check the queue and resolve as many jobs in the queue as possible
    tick() {

        let numToLoad = MAX_JOBS - Object.keys(this.pending).length;
        while (this.queue.length > 0 && numToLoad-- > 0) {
            let fn = this.queue.shift();
            /* istanbul ignore else */ // This will never else
            if (fn) {
                fn.call(null);
            }
        }
        setTimeout(this.tick.bind(this), 25);
    }
}
