// Loader
import { GridData } from './types';

// Constant we use further down
const STATUS_LOADING = 0;
const STATUS_LOADED = 1;
const STATUS_MISSING = -1;
const STATUS_EMPTY = -2;

interface StatusCache {
    [propName: string]: number;
}

export class Loader {

    status: StatusCache;

    constructor() {
        this.status = {};
    }

    isLoading(url: string) {
        return url in this.status && this.status[url] === STATUS_LOADING;
    }

    load(url: string) {

        // Update status for this URL
        this.status[url] = STATUS_LOADING;

        //
        return fetch(url)
            .then((response: Response): Promise<GridData> => {
                this.status[url] = STATUS_LOADED;
                return response.json()
            });
    }

}
