import * as THREE from 'three';
import { makeLandGeometry, makeEmptyGeometry, stitchGeometries } from '../../lib/data';

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

    // makeLandGeometry expands our geometry by 1, so a 2x2 becomes a 3x3
    // Assert the geometry has nine vertices and four faces
    expect(vertices.count).toEqual(9);
    expect(faces.count/3).toEqual(4);

    // Check co-ordinates of each vertex (remember we have to reverse it as
    // GridSquare is provided from NW corner down)
    expect(vertices.getX(0)).toEqual(520000);
    expect(vertices.getY(0)).toEqual(270000);
    expect(vertices.getZ(0)).toEqual(3);
    expect(vertices.getX(1)).toEqual(520050);
    expect(vertices.getY(1)).toEqual(270000);
    expect(vertices.getZ(1)).toEqual(3);
    expect(vertices.getX(3)).toEqual(520000);
    expect(vertices.getY(3)).toEqual(270050);
    expect(vertices.getZ(3)).toBeCloseTo(-2.1);
    expect(vertices.getX(4)).toEqual(520050);
    expect(vertices.getY(4)).toEqual(270050);
    expect(vertices.getZ(4)).toBeCloseTo(-2.1);

    expect(faces.array[0]).toEqual(0);
    expect(faces.array[1]).toEqual(1);
    expect(faces.array[2]).toEqual(3);

    expect(faces.array[3]).toEqual(1);
    expect(faces.array[4]).toEqual(4);
    expect(faces.array[5]).toEqual(3);

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
});

test('stitchGeometries() works properly', () => {

   var transform = new THREE.Matrix4().identity();

    // Parse a very simple square
    var tile = () => makeLandGeometry({
        meta: {
            gridReference: 'TL27',
            squareSize: 50,
        },
        data: [
            [1, 2],
            [3, 4],
        ]
    }, transform);

    // When parsed, our tile of heights gains an extra row at the top and a column on the right:
    // [1, 2, 2]
    // [1, 2, 2]
    // [3, 4, 4]

    // The array is indexed from the bottom left, for reference:
    // [6, 7, 8]
    // [3, 4, 5]
    // [0, 1, 2]

    // Attempt a left-right stitch
    var rightStitch = stitchGeometries(tile(), tile(), "right");

    // Stitched tile is now right hand column matches left, except for top row
    // [1, 2, 2]
    // [1, 2, 1]
    // [3, 4, 3]
    expect(rightStitch.getAttribute('position').getZ(2)).toBe(3);
    expect(rightStitch.getAttribute('position').getZ(5)).toBe(1);
    expect(rightStitch.getAttribute('position').getZ(8)).toBe(2);

    // Attempt a bottom-top stitch
    var topStitch = stitchGeometries(tile(), tile(), "top");

    // Stitched tile is now top row matches bottom, except for right hand column:
    // [3, 4, 2]
    // [1, 2, 2]
    // [3, 4, 4]
    expect(topStitch.getAttribute('position').getZ(6)).toBe(3);
    expect(topStitch.getAttribute('position').getZ(7)).toBe(4);
    expect(topStitch.getAttribute('position').getZ(8)).toBe(2);

    // Attempt a bottom left-top right stitch
    var topRightStitch = stitchGeometries(tile(), tile(), "topRight");

    // Stitched tile is now top row matches bottom, except for right hand column:
    // [1, 2, 3]
    // [1, 2, 2]
    // [3, 4, 4]
    expect(topRightStitch.getAttribute('position').getZ(2)).toBe(4);
    expect(topRightStitch.getAttribute('position').getZ(5)).toBe(2);
    expect(topRightStitch.getAttribute('position').getZ(6)).toBe(1);
    expect(topRightStitch.getAttribute('position').getZ(7)).toBe(2);
    expect(topRightStitch.getAttribute('position').getZ(8)).toBe(3);

});
