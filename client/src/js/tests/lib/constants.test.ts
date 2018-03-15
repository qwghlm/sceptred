import {colors, materials} from '../../lib/constants';

test('Test materials', () => {
    expect(materials.phong(0xffffff).type).toBe('MeshPhongMaterial');
    expect(materials.meshLambert(0xffffff).type).toBe('MeshLambertMaterial');
    expect(materials.meshWireFrame(0xffffff).type).toBe('MeshBasicMaterial');
    expect(materials.meshBasic(0xffffff).type).toBe('MeshBasicMaterial');
});
