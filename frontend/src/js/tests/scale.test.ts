import { gridrefToCoords } from '../lib/scale';

test('gridrefToCoords() works properly', () => {
    expect(gridrefToCoords('TL27'))
        .toEqual([520000, 270000]);

    expect(gridrefToCoords('TG5140913177'))
        .toEqual([651409, 313177]);
});
