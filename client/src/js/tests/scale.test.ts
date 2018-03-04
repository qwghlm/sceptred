import { makeScale } from '../lib/scale';

// Test our scaling function (meters -> pixels) works

test('Test makeScale', () => {

    const scale = makeScale(1000, 1000, 5);

    expect(scale(1000, 1000, 0)).toEqual([0, 0, 0]);
    expect(scale(1000, 1000, 5)).toEqual([0, 0, 0.5]);
    expect(scale(0, 0, 5)).toEqual([-20, 20, 0.5]);

});
