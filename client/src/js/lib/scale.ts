import * as THREE from 'three';

// Scaling function - from the origin, scale up by scale, and then translate to the origin
export function makeTransform(fOrigin: THREE.Vector3, tOrigin: THREE.Vector3, scale: THREE.Vector3) {

    // Reverse translate from, then scale, then translate to
    var mStart = (new THREE.Matrix4()).makeTranslation(-fOrigin.x, -fOrigin.y, -fOrigin.z);
    var mMiddle = makeScale(scale);
    var mEnd = (new THREE.Matrix4()).makeTranslation(tOrigin.x, tOrigin.y, tOrigin.z);

    // Reverse order as per rules of matrix multiplication
    return mEnd.multiply(mMiddle).multiply(mStart);

}

export function makeScale(scale: THREE.Vector3) {
    return (new THREE.Matrix4()).makeScale(scale.x, scale.y, scale.z)
}
