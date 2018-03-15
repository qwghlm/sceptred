import '../sass/index.scss';
import '../favicon.ico';

import './vendor/polyfills';

import { h, render } from "preact";
import { App } from './components/app';

render(<App/>, document.getElementById('app'));
