import '../sass/index.scss';
import '../favicon.ico';

import { h, render } from "preact";
import { App } from './components/app';

render(<App/>, document.getElementById('app'));
