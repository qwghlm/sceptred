import { Loader } from '../../lib/loader';

global.fetch = require('jest-fetch-mock');

test('Loader loads as standard', async () => {

    fetch.mockResponseOnce('{"foo": 3}');

    const loader = new Loader();
    const url = '/dummy_url';
    const result = loader.load(url);

    await result.then((json) => {
        expect(json).toEqual({foo: 3});
    });

    const cachedResult = loader.load(url);
    await cachedResult.then((json) => {
        expect(json).toEqual({foo: 3});
    });

});

test('Loader rejects repeated calls', async () => {

    fetch.mockResponseOnce('{"foo": 3}');

    const loader = new Loader();
    const url = '/dummy_url';
    const result = loader.load(url);
    const rejectedResult = loader.load(url);

    await expect(rejectedResult).rejects.toThrow();

    await result.then((json) => {
        expect(json).toEqual({foo: 3});
    });

});

test('Loader throws correctly on 404', async () => {

    fetch.mockResponseOnce('{}', {status: 404});
    const loader = new Loader();
    const url = '/dummy_url';
    const result = loader.load(url);

    await expect(result).rejects.toThrow();

});

test('Loader throws correctly on error', async () => {

    fetch.mockRejectOnce(new Error("Service unavailable"));

    const loader = new Loader();
    const url = '/dummy_url';
    const result = loader.load(url);

    await expect(result).rejects.toThrow();

});
