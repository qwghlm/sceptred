import '../sass/index.scss';
import '../favicon.ico';

import './vendor/polyfills';

import { h, render } from "preact";
import { App } from './components/app';

declare global {
    const Raven: any;
}

Raven.config('https://7ce65e7cf3a348d0acee6762f7c8fc85@sentry.io/305797', {
    release: '0.0.4' // TODO Get this sanely from package.json
}).install()
Raven.context(function () {
    render(<App/>, document.getElementById('app'));
});
