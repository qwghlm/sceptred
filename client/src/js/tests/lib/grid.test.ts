import * as THREE from 'three';
import { gridrefToCoords, coordsToGridref, getGridSquareSize, getSurroundingSquares, getNeighboringSquare } from '../../lib/grid';

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


test('getGridSquareSize() raises errors properly', () => {

    expect(getGridSquareSize("NT").x).toEqual(100000);
    expect(getGridSquareSize("NT27").x).toEqual(10000);
    expect(getGridSquareSize("NT2070").x).toEqual(1000);
    expect(getGridSquareSize("NT200700").x).toEqual(100);
    expect(getGridSquareSize("NT20007000").x).toEqual(10);
    expect(getGridSquareSize("NT2000070000").x).toEqual(1);

});

test('getSurroundingSquares() raises errors properly', () => {

    expect(getSurroundingSquares("NT27", 0)).toEqual([]);
    expect(getSurroundingSquares("NT27", 1))
        .toEqual(["NT16", "NT17", "NT18", "NT26", "NT28", "NT36", "NT37", "NT38"]);
    expect(getSurroundingSquares("NT200700", 1))
        .toEqual(["NT199699", "NT199700", "NT199701", "NT200699",
                  "NT200701", "NT201699", "NT201700", "NT201701"]);

});

test('getNeighboringSquare() resolves properly', () => {

    expect(getNeighboringSquare("NT27", 0, 0)).toEqual("NT27");

});
