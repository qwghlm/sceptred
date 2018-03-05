import * as THREE from 'three';

// Scaling function - from the origin, scale up by scale, and then translate to the origin
export function makeTransform(fOrigin: THREE.Vector3, tOrigin: THREE.Vector3, scale: THREE.Vector3) {

    var mStart = new THREE.Matrix4();
    mStart.makeTranslation(-fOrigin.x, -fOrigin.y, -fOrigin.z);

    var mMiddle = new THREE.Matrix4();
    mMiddle.makeScale(scale.x, scale.y, scale.z);

    var mEnd = new THREE.Matrix4();
    mEnd.makeTranslation(tOrigin.x, tOrigin.y, tOrigin.z);

    return mEnd.multiply(mMiddle).multiply(mStart);

}
