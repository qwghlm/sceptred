import * as THREE from 'three';

interface MaterialsLookup {
    [key: string] : (color: number) => THREE.Material
}

export const colors = {
    landColor : 0x105520,
    seaColor : 0x082044
};

export const materials: MaterialsLookup = {

    phong(color: number) {
        return new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide
        });
    },
    meshLambert(color: number) {
        return new THREE.MeshLambertMaterial({
            color: color,
            transparent: true
        });
    },
    meshWireFrame(color: number) {
        return new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            wireframe: true,
        });
    },
    meshBasic(color: number) {
        return new THREE.MeshBasicMaterial({
            color: color,
            transparent: true
        });
    }
};
