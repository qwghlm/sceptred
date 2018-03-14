// A very simple event listen/dispatch system

export class EventTarget {

    addEventListener: (s: string, f: Function) => void;
    removeEventListener: (s: string, f: Function) => void;
    dispatchEvent: (e: Event) => void;

    constructor() {

        var target = document.createTextNode("");

        // Pass EventTarget interface calls to DOM EventTarget object
        this.addEventListener = target.addEventListener.bind(target);
        this.removeEventListener = target.removeEventListener.bind(target);
        this.dispatchEvent = target.dispatchEvent.bind(target);

    }
}
