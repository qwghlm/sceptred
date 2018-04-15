// Functions for parsing data from the API
import * as THREE from 'three';

import { seaColorRGB, landColor } from './colors';
import { gridrefToCoords, getGridSquareSize } from './grid';
import { GridData } from './types';

// Parses the grid data and transforms from Ordnance Survey into world co-ordinates
//
// This is relatively costly:
//
// Preparing grid data: ~1ms
// Building vertices: 25-50ms
// Building faces: 5-10ms
// Converting to buffers: 2-6ms
// Building geometries: 5-25ms
// Total time: 40-90ms
export function makeLandGeometry(data: GridData, transform: THREE.Matrix4, sampleRate=1) {

    const tileOrigin = gridrefToCoords(data.meta.gridReference);
    const squareSize = data.meta.squareSize * sampleRate;

    var grid = sample(data.heights, sampleRate)

    const gridHeight = grid.length;
    const gridWidth = grid[0].length;

    // Calculate vertices and colors
    var vertices = new Float32Array(3*gridHeight*gridWidth);
    var colors = new Uint8Array(3*gridHeight*gridWidth);

    // Go through each row and then each column of the grid
    grid.forEach((row, y) => row.forEach((z, x) => {

        // Work out index of this point in the vertices & colors arrays
        // Each array is spaced out with three values, hence the multiplier
        const i = 3*(x + gridWidth*y);
        const isLand = grid[y][x] !== "";

        // Assign vertices
        vertices.set([
            tileOrigin.x + x*squareSize,
            tileOrigin.y + y*squareSize,
            isLand ? z : 0
        ], i);

        // Assign colors - r, g, b
        const color = isLand ? landColor(z).rgb() : seaColorRGB;
        colors.set(color, i);

    }));

    // Calculate the faces - two triangles which form between them a square
    var faces = new Uint16Array(6*(gridWidth - 1)*(gridHeight - 1));
    grid.forEach((row, y) => row.forEach((z, x) => {

        // Points that are in the right-most or bottom-most row/column cannot form top-left of a square
        if (x == gridWidth - 1 || y == gridHeight - 1) {
            return;
        }

        // Get indexes of the points for the square for which this point is the top-left
        var i = x + gridWidth*y;
        var a = i, b = i+1, c = i+gridWidth, d = i+gridWidth+1;

        // Assign faces (clockwise): ACD, ADB
        // c--d
        // |//|
        // a--b
        faces.set([a, c, d, a, d, b], 6*(i-y));

    }));

    // Build our buffers
    const verticesBuffer = transform.applyToBufferAttribute(new THREE.BufferAttribute(vertices, 3));
    const colorsBuffer = new THREE.BufferAttribute(colors, 3, true);
    const facesBuffer = new THREE.BufferAttribute(faces, 1);

    // And create a geometry from them
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', verticesBuffer);
    geometry.addAttribute('color', colorsBuffer);
    geometry.setIndex(facesBuffer);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    return geometry;

}

// Returns an empty square, useful for either the grid or an element of sea
export function makeEmptyGeometry(gridSquare:string, transform: THREE.Matrix4, scale: THREE.Vector3) {

    let square = getGridSquareSize(gridSquare).applyMatrix4((new THREE.Matrix4()).scale(scale));

    // Calculate position of square
    // The half-square addition at the end is to take into account PlaneGeometry
    // is created around the centre of the square and we want it to be bottom-left

    let coords = gridrefToCoords(gridSquare).applyMatrix4(transform);
    let geometry = new THREE.PlaneGeometry(square.x, square.y);
    geometry.translate(coords.x + square.x/2, coords.y + square.y/2, coords.z);
    geometry.computeBoundingBox();
    return geometry;

}

export function sample(input, sampleRate=1) {

    if ((input.length - 1) % sampleRate !== 0) {
        throw new Error("Sample rate must be factor of array size");
    }

    const n = 1 + (input.length - 1) / sampleRate;
    let output = new Array(n);

    for (var i = 0; i < n; i++) {
        if (sampleRate === 1) {
            output[i] = input[i].slice();
        }
        else {
            output[i] = new Array(n);
            for (var j = 0; j < n; j++) {
                output[i][j] = input[i * sampleRate][j * sampleRate];
            }
        }
    }
    return output
}
