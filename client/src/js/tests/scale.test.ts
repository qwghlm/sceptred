import { linearScale } from '../lib/scale';

test('Test linearScale', () => {

    const scale = linearScale(0, 10, 2);

    expect(scale(0)).toBe(10);
    expect(scale(1)).toBe(12);
    expect(scale(-1)).toBe(8);

});
