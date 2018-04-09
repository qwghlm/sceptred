import * as THREE from 'three';

import { seaColor } from './colors';
import { makeLandGeometry, makeEmptyGeometry } from './data';
import { coordsToGridref, gridrefToCoords, getSurroundingSquares, getNeighboringSquare } from './grid';
import { Loader } from './loader';
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
            .catch((errorResponse) => {
                console.error(errorResponse);
            })
            .then((json) => this.onLoad(json))
    }

    // Manipulating meshes

    // Loads the grid data from the API
    onLoad(grid: GridData) {

        // TODO gridSquare or gridReference?
        let gridSquare = grid.meta.gridReference;
        this.removeFromWorld(gridSquare);

        // If height data exists, then make a land geometry
        if (grid.heights.length) {
            let geometry = makeLandGeometry(grid, this.transform);
            let landMesh = makeLand(geometry, gridSquare);
            this.addToWorld(landMesh);
        }
        else {
            let seaGeometry = makeEmptyGeometry(gridSquare, this.transform, this.scale)
            let seaMesh = makeSea(seaGeometry, gridSquare);
            this.addToWorld(seaMesh)
        }

        // Queue the surrounding squares
        getSurroundingSquares(gridSquare, 1).forEach(surroundingSquare => {
            if (!(this.tiles.getObjectByName(surroundingSquare))) {
                let emptyGeometry = makeEmptyGeometry(surroundingSquare, this.transform, this.scale);
                let emptyMesh = makeWireframe(emptyGeometry, surroundingSquare);
                this.addToWorld(emptyMesh);
            }
        });
    }

    addToWorld(mesh: THREE.Mesh) {
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

    // Checking to see if any unloaded meshes can be loaded in
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
            .filter(d => d.type == "Mesh" && isEmptyMesh(<THREE.Mesh>d))
            .filter(d => {
                var geometry = (<THREE.Mesh>d).geometry;
                return frustum.intersectsBox(geometry.boundingBox);
            })
            .map(d => getDistanceFromPoint(<THREE.Mesh>d, center));

        emptyMeshes.sort((a, b) => a.distance - b.distance);
        emptyMeshes.forEach((d, i) => {
            this.load(d.name);
        });

        // Find land or sea meshes that are out of view and replace with an empty one
        var unwantedMeshes = this.tiles.children
            .filter(d => d.type == "Mesh" && !isEmptyMesh(<THREE.Mesh>d))
            .filter(d => {
                var geometry = (<THREE.Mesh>d).geometry;
                return !frustum.intersectsBox(geometry.boundingBox);
            })
            .map(d => getDistanceFromPoint(<THREE.Mesh>d, center));

        unwantedMeshes.sort((a, b) => b.distance - a.distance);

        // Bulk-replace the meshes with empty ones
        var newEmptyMeshes = unwantedMeshes.slice(0, 10).map(d => {
            this.removeFromWorld(d.name);
            let emptyGeometry = makeEmptyGeometry(d.name, this.transform, this.scale);
            return makeWireframe(emptyGeometry, d.name);
        });
        if (newEmptyMeshes.length) {
            this.addManyToWorld(newEmptyMeshes);
        }
    }
}

// Mesh utility functions

function isEmptyMesh (mesh: THREE.Mesh) {
    return (mesh.material as THREE.Material).type == 'MeshBasicMaterial'
}

function getDistanceFromPoint(mesh: THREE.Mesh, point: THREE.Vector3) {
    var meshCenter = mesh.geometry.boundingSphere.center.clone();
    meshCenter.setZ(0);
    return {
        name: mesh.name,
        distance: meshCenter.sub(point).length()
    }
}

// Generic mesh making functions

// Make a land mesh
function makeLand(geometry: THREE.BufferGeometry, name: string) {

    let land = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    }));
    land.name = name;
    return land;
}

// Make a sea mesh
function makeSea(geometry: THREE.Geometry, name: string) {

    let sea = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: seaColor,
    }))
    sea.name = name;
    return sea;
}

// Make a wireframe mesh for unloaded
function makeWireframe(geometry: THREE.Geometry, name: string) {

    let wireframe = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        wireframe: true,
    }));
    wireframe.name = name;
    return wireframe;
}
