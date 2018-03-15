import { Loader } from '../../lib/loader';

global.fetch = require('jest-fetch-mock');

test('Loader works properly', async () => {

    fetch.mockResponseOnce('{"foo": 3}');

    const loader = new Loader();
    const url = '/dummy_url';
    const result = loader.load(url);

    expect(loader.isLoading(url)).toBe(true);

    await result.then((json) => {
        expect(json).toEqual({foo: 3});
        expect(loader.isLoading(url)).toBe(false);
    })

});

test('Loader throws correctly', async () => {

    fetch.mockRejectOnce(new Error("Service unavailable"));

    const loader = new Loader();
    const url = '/dummy_url';
    const result = loader.load(url);

    expect(result).rejects.toThrow();

});