import * as THREE from 'three';
import { makeLandGeometry, makeEmptyGeometry } from '../../lib/data';

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

test('makeEmptyGeometry() works properly', () => {

    var transform = new THREE.Matrix4().identity();
    var scale = new THREE.Vector3(1, 1, 1);

    var geometry = makeEmptyGeometry("TL27", transform, scale);

    var vertices = geometry.vertices;
    var faces = geometry.faces;

    expect(vertices.length).toEqual(4);
    expect(vertices[0].x).toEqual(520000);
    expect(vertices[0].y).toEqual(280000);
    expect(vertices[1].x).toEqual(530000);
    expect(vertices[1].y).toEqual(280000);
    expect(vertices[2].x).toEqual(520000);
    expect(vertices[2].y).toEqual(270000);
    expect(vertices[3].x).toEqual(530000);
    expect(vertices[3].y).toEqual(270000);

    expect(faces[0].a).toEqual(0);
    expect(faces[0].b).toEqual(2);
    expect(faces[0].c).toEqual(1);
    expect(faces[1].a).toEqual(2);
    expect(faces[1].b).toEqual(3);
    expect(faces[1].c).toEqual(1);
})