// Functions for creating meshes
import * as THREE from 'three';

import { makeLandGeometry, makeEmptyGeometry } from './geometry';
import { GridData } from './types';
import { seaColor } from './colors';

// Make a land mesh
export function makeLand(data: GridData, transform: THREE.Matrix4) {

    let geometry = makeLandGeometry(data, transform);
    let land = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    }));
    land.name = data.meta.gridReference;
    return land;
}

// Make a sea mesh
export function makeSea(gridSquare: string, transform: THREE.Matrix4, scale: THREE.Vector3) {

    let geometry = makeEmptyGeometry(gridSquare, transform, scale);
    let sea = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: seaColor,
    }))
    sea.name = gridSquare;
    return sea;
}

// Make a wireframe mesh for unloaded
export function makeEmpty(gridSquare: string, transform: THREE.Matrix4, scale: THREE.Vector3) {

    let geometry = makeEmptyGeometry(gridSquare, transform, scale);
    let wireframe = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        wireframe: true,
    }));
    wireframe.name = gridSquare;
    return wireframe;
}
