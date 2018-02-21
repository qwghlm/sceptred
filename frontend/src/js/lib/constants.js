const THREE = require('three');

export const materials = {

    phong(color) {
        return new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide
        });
    },
    meshLambert(color) {
        return new THREE.MeshLambertMaterial({
            color: color,
            specular: 0x009900,
            shininess: 30,
            shading: THREE.SmoothShading,
            transparent: true
        });
    },
    meshWireFrame(color) {
        return new THREE.MeshBasicMaterial({
            color: color,
            specular: 0x009900,
            shininess: 30,
            shading: THREE.SmoothShading,
            wireframe: true,
            transparent: true
        });
    },
    meshBasic(color) {
        return new THREE.MeshBasicMaterial({
            color: color,
            specular: 0x009900,
            shininess: 30,
            shading: THREE.SmoothShading,
            transparent: true
        });
    }
};
