import '../sass/index.scss';
import { MapView } from './map';

document.addEventListener("DOMContentLoaded", function(e) {
    new MapView(
        document.querySelector('#map-view-wrapper'),
        {
            gridSquares : ['NT27'],
        }
    );
});
