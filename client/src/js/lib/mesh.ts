// Functions for creating meshes
import * as THREE from 'three';

import { makeLandGeometry, makeEmptyGeometry } from './geometry';
import { GridData } from './types';
import { seaColor } from './colors';

// Make a series of land meshes
export function makeLand(data: GridData, transform: THREE.Matrix4) {

    const sampleRates = [1, 4, 8]
    var lod = new THREE.LOD();
    for (var i=0; i<sampleRates.length; i++) {
        let geometry = makeLandGeometry(data, transform, sampleRates[i]);
        let land = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            vertexColors: THREE.VertexColors,
            side: THREE.DoubleSide
        }));
        lod.addLevel(land, (i+1)*250);
    }

    lod.name = data.meta.gridReference;
    return lod;
}

// Make a sea mesh
export function makeSea(gridSquare: string, transform: THREE.Matrix4) {

    let geometry = makeEmptyGeometry(gridSquare, transform);
    let sea = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: seaColor,
    }))
    sea.name = gridSquare;
    return sea;
}

// Make a wireframe mesh for unloaded
export function makeEmpty(gridSquare: string, transform: THREE.Matrix4) {

    let geometry = makeEmptyGeometry(gridSquare, transform);
    let wireframe = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        wireframe: true,
    }));
    wireframe.name = gridSquare;
    return wireframe;
}
