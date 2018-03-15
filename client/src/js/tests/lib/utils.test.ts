import * as utils from '../../lib/utils';

// Test object extend function

test('extend() extends properly', () => {
    expect(utils.extend({foo: "bar"}, {foo: "baz", bat: 'qux'}))
        .toEqual({foo: "baz", bat: 'qux'});
});

test('extend() is fine with null', () => {
    expect(utils.extend(null, {foo: "bar"}, {foo: "baz", bat: 'qux'}, null))
        .toEqual({foo: "baz", bat: 'qux'});
});

test('debounce() extends properly', () => {

    jest.useFakeTimers();

    const test = jest.fn();
    const debouncedTest = utils.debounce(test);
    debouncedTest();
    expect(test).toHaveBeenCalledTimes(0);

    debouncedTest();
    expect(test).toHaveBeenCalledTimes(0);

    jest.runAllTimers();
    expect(test).toHaveBeenCalledTimes(1);

});
