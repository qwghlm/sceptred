import * as THREE from 'three';
import { makeTransform } from '../../lib/scale';

// Test our transform function (meters -> pixels) works
test('Test makeScale', () => {

    const scale = makeTransform(
        new THREE.Vector3(-1, -1, -1),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(2, 2, 2)
    );

    expect(scale.elements).toEqual([
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        3, 3, 3, 1
    ])

});
