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

    // Convert grid into vertices and faces
    var vertices: THREE.Vector3[] = [];
    var faces: THREE.Face3[] = [];

    // Grid data starts in north-west while Ordnance Survey origin is in south-west
    // so we reverse the rows first

    // TODO Convert this into pure array and run matrix math on the whole lot at once?
    grid.reverse().forEach((row, y) => row.forEach((z, x) => {

        var coords = new Float32Array([
            tileOrigin[0] + x*squareSize,
            tileOrigin[1] + y*squareSize,
            z
        ]);
        var buffer = new THREE.BufferAttribute(coords, coords.length);

        var v = new THREE.Vector3;
        v.fromBufferAttribute(transform.applyToBufferAttribute(buffer), 0)
        vertices.push(v);

        // If this point can form top-left of a square, add the two
        // triangles that are formed by that square
        if (x < gridWidth - 1 && y < gridHeight - 1) {

            // Work out index of this point in the vertices array
            var i = x + gridWidth*y;

            // First triangle: top-left, top-right, bottom-left
            faces.push(new THREE.Face3(i, i+1, i+gridWidth));

            // Second triangle: top-right, bottom-right, bottom-left
            faces.push(new THREE.Face3(i+1, i+gridWidth+1, i+gridWidth));
        }

    }));

    var geometry = new THREE.Geometry();
    geometry.vertices = vertices;
    geometry.faces = faces;
    return geometry;

}
