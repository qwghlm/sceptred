import '../sass/index.scss';
import { Map } from './map';

document.addEventListener("DOMContentLoaded", function(e) {
    let element = <HTMLElement> document.querySelector('#map-view-wrapper');
    new Map(
        element,
        {
            origin : [325000, 675000],
            heightFactor: 2,
            debug : true,
        }
    );
});
