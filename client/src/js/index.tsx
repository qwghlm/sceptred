import '../sass/index.scss';
import '../favicon.ico';

import { h, render } from "preact";
import { App } from './app';

render(<App/>, document.getElementById('app'));
