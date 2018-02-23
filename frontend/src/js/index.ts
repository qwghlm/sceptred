import '../sass/index.scss';
import { MapView } from './map';

document.addEventListener("DOMContentLoaded", function(e) {
    let element = <HTMLElement> document.querySelector('#map-view-wrapper');
    new MapView(
        element,
        {
            gridSquares : ['NT27'],
        }
    );
});
