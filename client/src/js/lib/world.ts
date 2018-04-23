import * as THREE from 'three';

import { coordsToGridref, gridrefToCoords, getSurroundingSquares, getNeighboringSquare } from './grid';
import { Loader } from './loader';
import { makeLand, makeSea, makeEmpty } from './mesh';
import { makeTransform, makeScale } from './scale';
import { GridData } from './types';
import { debounce } from './utils';

// Constants we use

const metresPerPixel = 50;
const heightFactor = 2;

// Models the world in which our tiles live

export class World extends THREE.EventDispatcher {

    private loader: Loader;
    private scale: THREE.Vector3;
    private transform: THREE.Matrix4;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    tiles: THREE.Group;
    update: () => void;

    // Start us up
    constructor(width: number, height: number) {

        super();

        // Debounce this._update so it can only be called every half-second max
        // So if a user is continually moving camera, this will only be called
        // once camera movement has ceased for 500ms
        this.update = debounce(this._update.bind(this), 500);

        // Setup camera
        var camera = this.camera = new THREE.PerspectiveCamera(70, width / height, 1, 10000);
        camera.position.z = 0.6*width;

        // Setup scene
        var scene = this.scene = new THREE.Scene();

        // Lights
        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1);
        scene.add(light);

        var spotLight = new THREE.SpotLight(0xcccccc);
        spotLight.position.set(-1000, -1000, 1000);
        spotLight.castShadow = true;
        scene.add(spotLight);

        var ambientLight = new THREE.AmbientLight(0x080808);
        scene.add(ambientLight);

        // Add tiles
        this.tiles = new THREE.Group();
        scene.add(this.tiles)

        // Set up scale
        this.scale = new THREE.Vector3(1/metresPerPixel, 1/metresPerPixel, heightFactor/metresPerPixel);

        // Set up loader
        this.loader = new Loader();

    }

    // Setup transform from real-world to 3D world coordinates
    navigateTo(gridref: string) {

        this.removeAllFromWorld();

        // Calculate the real origin (i.e. where the world is centred),
        // the world origin (i.e (0, 0, 0))
        // and the transform to get from one to the other
        var realOrigin = gridrefToCoords(gridref);
        var worldOrigin = new THREE.Vector3(0, 0, 0);
        this.transform = makeTransform(realOrigin, worldOrigin, this.scale);

        // Work out our origin as a two-letter square
        var gridSquare = coordsToGridref(realOrigin, 2);

        // Then load the square in the middle
        this.load(gridSquare);

    }

    // Resizes the world e.g. if the window has resized
    setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    // Load the gridsquare
    load(gridReference: string) {

        const url = `/data/${gridReference}`;

        // Set load and error listeners
        return this.loader.load(url)
            .then((json) => {
                this.onLoad(json)
            })
            .catch((errorResponse) => {
                console.error(errorResponse);
            })
    }

    // Manipulating meshes

    // Loads the grid data from the API
    onLoad(grid: GridData) {

        const gridSquare = grid.meta.gridReference;
        this.removeFromWorld(gridSquare);

        // If height data exists, then make a land geometry
        if (grid.heights.length) {
            const landMesh = makeLand(grid, this.transform);
            this.addToWorld(landMesh);
        }
        else {
            const seaMesh = makeSea(gridSquare, this.transform);
            this.addToWorld(seaMesh)
        }

        // Queue the surrounding squares
        getSurroundingSquares(gridSquare, 1).forEach(surroundingSquare => {
            if (!(this.tiles.getObjectByName(surroundingSquare))) {
                let emptyMesh = makeEmpty(surroundingSquare, this.transform);
                this.addToWorld(emptyMesh);
            }
        });
    }

    addToWorld(mesh: THREE.Object3D) {
        this.tiles.add(mesh);
        this.dispatchEvent({type: 'update', message: 'From ' + mesh.name });
    }

    addManyToWorld(meshes: THREE.Mesh[]) {
        meshes.forEach(mesh => this.tiles.add(mesh));
        this.dispatchEvent({type: 'update', message: "From " + meshes.join(', ')});
    }

    // Removes a mesh from the world
    removeFromWorld(name: string) {

        var obj = this.tiles.getObjectByName(name);
        if (obj) {
            this.tiles.remove(obj);
        }
    }

    // Clears the entire world
    removeAllFromWorld() {
        while (this.tiles.children.length) {
            this.tiles.remove(this.tiles.children[0]);
        }
    }

    // Updates level of detail on tiles
    updateLevelsOfDetail() {
        this.tiles.children.forEach((object) => {
            if (object instanceof THREE.LOD) {
                object.update(this.camera);
            }
        });
    }

    // Checking to see if any unloaded meshes can be loaded in, and what loaded
    // meshes can be culled out
    // This is typically not called directly by the world, but by the parent renderer
    _update() {

        // Work out where the center of the screen coincides with the tilemap
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        var meshes = this.tiles.children;
        var intersects = raycaster.intersectObjects(meshes);
        if (intersects.length === 0) {
            return;
        }
        var center = intersects[0].point;
        center.setZ(0);

        // Calculate the frustum of this camera
        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(
            this.camera.projectionMatrix, this.camera.matrixWorldInverse));

        // Find every empty mesh on screen that is displayed in the camera
        var emptyMeshes = this.tiles.children
            .filter(isEmpty)
            .filter(d => {
                return frustum.intersectsBox(getGeometry(d).boundingBox);
            })
            .map(d => getDistanceFromPoint(<THREE.Mesh>d, center));

        emptyMeshes.sort((a, b) => a.distance - b.distance);
        emptyMeshes.forEach((d, i) => {
            this.load(d.name);
        });

        // Find land or sea meshes that are out of view and replace with an empty one
        var unwantedMeshes = this.tiles.children
            .filter(isLandOrSea)
            .filter(d => {
                return !frustum.intersectsBox(getGeometry(d).boundingBox);
            })
            .map(d => getDistanceFromPoint(d, center));

        unwantedMeshes.sort((a, b) => b.distance - a.distance);

        // Bulk-replace the meshes with empty ones
        var newEmptyMeshes = unwantedMeshes.slice(0, 10).map(d => {
            this.removeFromWorld(d.name);
            return makeEmpty(d.name, this.transform);
        });
        if (newEmptyMeshes.length) {
            this.addManyToWorld(newEmptyMeshes);
        }
    }
}

// Mesh utility functions

function isEmpty(obj: THREE.Object3D) {
    if (obj.type == "Mesh") {
        return (<THREE.Material>(<THREE.Mesh>obj).material).type == 'MeshBasicMaterial';
    }
    return false;
}

function isLandOrSea(obj: THREE.Object3D) {
    if (obj.type == "Mesh") {
        return (<THREE.Material>(<THREE.Mesh>obj).material).type != 'MeshBasicMaterial';
    }
    else if (obj.type == "LOD") {
        return true;
    }
    return false;
}

function getGeometry(obj: THREE.Object3D) {
    if (obj.type == "Mesh") {
        return (<THREE.Mesh>obj).geometry;
    }
    else if (obj.type == "LOD") {
        return (<THREE.Mesh>(<THREE.LOD>obj).children[0]).geometry;
    }
    throw Error("Object does not have geometry");
}

function getDistanceFromPoint(obj: THREE.Object3D, point: THREE.Vector3) {
    let boundingSphere = getGeometry(obj).boundingSphere;
    if (boundingSphere === null) {
        return {
            name: obj.name,
            distance: Infinity
        }
    }
    let meshCenter = boundingSphere.center.clone();
    meshCenter.setZ(0);
    return {
        name: obj.name,
        distance: meshCenter.sub(point).length()
    }
}

