import { Loader } from '../../lib/loader';

global.fetch = require('jest-fetch-mock');

const url = '/dummy_url';
const fallback = JSON.stringify({foo:null});

test('Loader loads as standard', async () => {

    fetch.mockResponseOnce('{"foo": 3}');

    const loader = new Loader();
    const result = loader.load(url);

    await result.then((json) => {
        expect(json).toEqual({foo: 3});
    });

    const cachedResult = loader.load(url);
    await cachedResult.then((json) => {
        expect(json).toEqual({foo: 3});
    });

});

test('Loader rejects if a call is repeated before completion', async () => {

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

test('Loader throws on any other 4xx', async () => {

    fetch.mockResponseOnce('{}', {status: 403});
    const loader = new Loader();
    const result = loader.load(url);

    await expect(result).rejects.toThrow();

});

test('Loader throws correctly on network error', async () => {

    fetch.mockRejectOnce(new Error("Connection unavailable"));

    const loader = new Loader();
    const result = loader.load(url);

    await expect(result).rejects.toThrow();

});
