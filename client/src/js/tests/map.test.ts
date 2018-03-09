import { BaseMap } from '../map.base';

// TODO Mocks for the libraries

global.fetch = require('jest-fetch-mock');

test('BaseMap works', () => {

    document.body.innerHTML = "<div id='test'></div>";

    var view = new BaseMap(
        document.getElementById('test'),
        {
            origin : [1e05, 1e05],
            heightFactor: 1,
            debug : false,
        }
    );

    // TODO Run some assertions

});
