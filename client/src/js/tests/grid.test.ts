import { gridrefToCoords, coordsToGridref } from '../lib/grid';

// TODO Fix red squiggles

test('gridrefToCoords() works properly', () => {

    expect(gridrefToCoords('TL27'))
        .toEqual([520000, 270000]);

    expect(gridrefToCoords('TG 51409 13177'))
        .toEqual([651409, 313177]);
});

test('gridrefToCoords() raises errors properly', () => {

    expect(() => gridrefToCoords('520000 270000')).toThrow(/Invalid/);

    expect(() => gridrefToCoords('AA 00000 00000')).toThrow(/outside of UK/);

    expect(() => gridrefToCoords('II 00000 00000')).toThrow(/I is not used/);

});

test('coordsToGridref() works properly', () => {

    expect(coordsToGridref(520000, 270000, 2))
        .toEqual('TL27');

    expect(coordsToGridref(520001, 470001, 10))
        .toEqual('TA2000170001');

    expect(coordsToGridref(520001, 470001))
        .toEqual('TA2000170001');

});

test('coordsToGridref() raises errors properly', () => {

    expect(() => coordsToGridref(520000, 270000, 3)).toThrow(/Invalid/)

    expect(() => coordsToGridref(-520000, 270000, 4)).toThrow(/not within/)


});
