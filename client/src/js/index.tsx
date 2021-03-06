import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './components/app';

import { version } from '../../../package.json';
import './vendor/polyfills';
import '../sass/index.scss';
import '../favicon.ico';

declare global {
    const Raven: any;
}

function load() {
    ReactDOM.render(<App/>, document.getElementById('app'));
}

// Configure raven
if (window['SCEPTRED_PROD']) {
    Raven.config('https://7ce65e7cf3a348d0acee6762f7c8fc85@sentry.io/305797', {
        release: version
    }).install()

    // Load app
    Raven.context(load);
}
else {
    load();
}
