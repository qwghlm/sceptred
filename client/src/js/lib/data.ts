// Functions for parsing data from the API
import * as THREE from 'three';
import * as chroma from 'chroma-js';
import { gridrefToCoords, getGridSquareSize } from './grid';
import { GridData } from './types';

const colorRange = [0x3D7F28, 0x155B11, 0xC5BB52, 0xB37528, 0x999999, 0xCCCCCC];
const colorDomain = [0, 200, 400, 600, 800, 1000, 1400];

// Parses the grid data and transforms from Ordnance Survey into world co-ordinates
export function makeLandGeometry(data: GridData, transform: THREE.Matrix4) {

    const tileOrigin = gridrefToCoords(data.meta.gridReference);
    const squareSize = data.meta.squareSize;
    const grid = data.data;

    var gridHeight = grid.length;
    var gridWidth = grid[0].length;

    // Grid data starts in north-west while Ordnance Survey origin is in south-west
    // so we reverse the rows first

    var vertices = new Float32Array(3*gridHeight*gridWidth);
    var colors = new Uint8Array(3*gridHeight*gridWidth);
    var faces: number[] = [];
    var n = 0;
    var colorFunction = chroma.scale(colorRange)
        .domain(colorDomain)
        .mode('lab');
    grid.reverse().forEach((row, y) => row.forEach((z, x) => {

        // Assign vertices
        vertices[n] = tileOrigin.x + x*squareSize;
        vertices[n+1] = tileOrigin.y + y*squareSize;
        vertices[n+2] = z;

        var color = colorFunction(z).rgb();
        colors[n] = color[0];
        colors[n+1] = color[1];
        colors[n+2] = color[2];

        n += 3;

        // If this point can form top-left of a square, add the two
        // triangles that are formed by that square
        if (x < gridWidth - 1 && y < gridHeight - 1) {

            // Work out index of this point in the vertices array
            var i = x + gridWidth*y;

            faces.push(
                // First triangle: top-left, top-right, bottom-left
                i, i+1, i+gridWidth,

                // Second triangle: top-right, bottom-right, bottom-left
                i+1, i+gridWidth+1, i+gridWidth);

        }


    }));

    var verticesBuffer = transform.applyToBufferAttribute(new THREE.BufferAttribute(vertices, 3));
    var colorsBuffer = new THREE.BufferAttribute(colors, 3, true);

    // TODO OnUpload?
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', verticesBuffer);
    geometry.addAttribute('color', colorsBuffer);
    geometry.setIndex(faces);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    return geometry;

}


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
