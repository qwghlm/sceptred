import * as THREE from 'three';
import { gridrefToCoords, coordsToGridref } from '../lib/grid';

test('gridrefToCoords() works properly', () => {

    expect(gridrefToCoords('TL27'))
        .toEqual({x:520000, y:270000, z:0});

    expect(gridrefToCoords('TG 51409 13177'))
        .toEqual({x:651409, y:313177, z:0});
});

test('gridrefToCoords() raises errors properly', () => {

    expect(() => gridrefToCoords('520000 270000')).toThrow(/Invalid/);

    expect(() => gridrefToCoords('AA 00000 00000')).toThrow(/outside of UK/);

    expect(() => gridrefToCoords('II 00000 00000')).toThrow(/I is not used/);

});

test('coordsToGridref() works properly', () => {

    expect(coordsToGridref(new THREE.Vector3(520000, 270000, 0), 2))
        .toEqual('TL27');

    expect(coordsToGridref(new THREE.Vector3(520001, 470001, 0), 10))
        .toEqual('TA2000170001');

    expect(coordsToGridref(new THREE.Vector3(520001, 470001)))
        .toEqual('TA2000170001');

});

test('coordsToGridref() raises errors properly', () => {

    expect(() => coordsToGridref(new THREE.Vector3(520000, 270000, 0), 3)).toThrow(/Invalid/)

    expect(() => coordsToGridref(new THREE.Vector3(-520000, 270000, 0), 4)).toThrow(/not within/)

});
