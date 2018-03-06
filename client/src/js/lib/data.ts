// Functions for data parsing

import * as THREE from 'three';
import { gridrefToCoords } from './grid';

interface GridData {
    meta: {
        squareSize: number,
        gridReference: string
    },
    data: number[][],
}

export function loadGridSquare(id: string) {
    return fetch(`/data/${id}`)
        .then(response => response.json())
}

export function parseGridSquare(data: GridData, transform: THREE.Matrix4) {

    const tileOrigin = gridrefToCoords(data.meta.gridReference);
    const squareSize = data.meta.squareSize;
    const grid = data.data;

    var gridHeight = grid.length;
    var gridWidth = grid[0].length;

    // Grid data starts in north-west while Ordnance Survey origin is in south-west
    // so we reverse the rows first

    var vertices = new Float32Array(3*gridHeight*gridWidth);
    var faces: number[] = [];
    var n = 0;
    grid.reverse().forEach((row, y) => row.forEach((z, x) => {
        vertices[n] = tileOrigin[0] + x*squareSize;
        vertices[n+1] = tileOrigin[1] + y*squareSize;
        vertices[n+2] = z;
        n += 3;

        // If this point can form top-left of a square, add the two
        // triangles that are formed by that square
        if (x < gridWidth - 1 && y < gridHeight - 1) {

            // Work out index of this point in the vertices array
            var i = x + gridWidth*y;

            // First triangle: top-left, top-right, bottom-left
            faces.push(i, i+1, i+gridWidth);

            // Second triangle: top-right, bottom-right, bottom-left
            faces.push(i+1, i+gridWidth+1, i+gridWidth);
        }


    }));

    var verticesBuffer = transform.applyToBufferAttribute(new THREE.BufferAttribute(vertices, 3));
    // TODO OnUpload?
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', verticesBuffer);
    geometry.setIndex(faces);
    geometry.computeVertexNormals();
    return geometry;

}
