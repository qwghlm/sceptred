import * as THREE from 'three';
import { makeLandGeometry } from '../../lib/data';

jest.mock('../../lib/grid', () => ({
    gridrefToCoords: jest.fn(() => ({x:520000, y:270000}))
}));

test('makeLandGeometry() works properly', () => {

    var transform = new THREE.Matrix4().identity();

    // Parse a very simple square
    var geometry = makeLandGeometry({
        meta: {
            gridReference: 'TL27',
            squareSize: 50,
        },
        data: [
            [-2.1, -2.1],
            [3, 3]
        ]
    }, transform);

    var vertices = geometry.getAttribute('position');
    var faces = geometry.getIndex();

    // Assert the geometry has four vertices and two faces (with three corners each)
    expect(vertices.count).toEqual(4);
    expect(faces.count).toEqual(6);

    // Check co-ordinates of each vertex (remember we have to reverse it as
    // GridSquare is provided from NW corner down)
    expect(vertices.getX(0)).toEqual(520000);
    expect(vertices.getY(0)).toEqual(270000);
    expect(vertices.getZ(0)).toEqual(3);
    expect(vertices.getX(1)).toEqual(520050);
    expect(vertices.getY(1)).toEqual(270000);
    expect(vertices.getZ(1)).toEqual(3);
    expect(vertices.getX(2)).toEqual(520000);
    expect(vertices.getY(2)).toEqual(270050);
    expect(vertices.getZ(2)).toBeCloseTo(-2.1);
    expect(vertices.getX(3)).toEqual(520050);
    expect(vertices.getY(3)).toEqual(270050);
    expect(vertices.getZ(3)).toBeCloseTo(-2.1);

    expect(faces.array[0]).toEqual(0);
    expect(faces.array[1]).toEqual(1);
    expect(faces.array[2]).toEqual(2);

    expect(faces.array[3]).toEqual(1);
    expect(faces.array[4]).toEqual(3);
    expect(faces.array[5]).toEqual(2);

});
