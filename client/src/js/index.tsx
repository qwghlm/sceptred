import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './components/app';

import { version } from '../../../package.json';
import './vendor/polyfills';
import '../sass/index.scss';

// TODO Shorten this
import '../favicon.ico';
require('../manifest.json');
require('../img/icons/icon-128x128.png');
require('../img/icons/icon-144x144.png');
require('../img/icons/icon-152x152.png');
require('../img/icons/icon-192x192.png');
require('../img/icons/icon-384x384.png');
require('../img/icons/icon-512x512.png');
require('../img/icons/icon-72x72.png');
require('../img/icons/icon-96x96.png');

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
