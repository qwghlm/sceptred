import { Loader } from '../lib/loader';

global.fetch = require('jest-fetch-mock');

test('Loader works properly', async () => {

    fetch.mockResponse('{"foo": 3}')

    const loader = new Loader();
    const url = '/dummy_url';
    const result = loader.load(url);

    expect(loader.isLoading(url)).toBe(true);

    await result.then((json) => {
        expect(json).toEqual({foo: 3});
        expect(loader.isLoading(url)).toBe(false);
    })

});
