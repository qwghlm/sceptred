import * as THREE from 'three';

import { makeLandGeometry, makeEmptyGeometry, stitchGeometries } from './data';
import { coordsToGridref, gridrefToCoords, getSurroundingSquares, getNeighboringSquare } from './grid';
import { Loader } from './loader';
import { makeTransform, makeScale } from './scale';
import { GridData } from './types';
import { debounce } from './utils';

// Constants we use

const metresPerPixel = 50;
const heightFactor = 2;
const seaColor = 0x082044;

// Models the world in which our tiles live

export class World extends THREE.EventDispatcher {

    private loader: Loader;
    private scale: THREE.Vector3;
    private transform: THREE.Matrix4;
    private bufferGeometries: { [propName: string]: THREE.BufferGeometry; };

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

        // Setup lookup of buffer geometries
        this.bufferGeometries = {};

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

        // FIXME
        // var url = `/data/${gridReference}`;
        const url = `/data/${gridReference.toLowerCase()}.json`;

        const fallback = JSON.stringify({meta: {gridReference}, data: [], land: []});

        // Set load and error listeners
        return this.loader.load(url, fallback)
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

        // If data exists, then make a land geometry
        if (grid.data.length) {

            let geometry = makeLandGeometry(grid, this.transform);

            // Try stitching this to existing geometries
            let neighbors : { [key: string]: string } = {
                right : getNeighboringSquare(gridSquare, 1, 0),
                top : getNeighboringSquare(gridSquare, 0, 1),
                topRight : getNeighboringSquare(gridSquare, 1, 1),
            }
            Object.keys(neighbors).forEach(direction => {
                if (neighbors[direction] in this.bufferGeometries) {
                    let neighborGeometry = this.bufferGeometries[neighbors[direction]];
                    stitchGeometries(geometry, neighborGeometry, direction);
                }
            });

            // Add the geometry to the world
            let landMesh = makeLand(geometry, gridSquare);
            this.addToWorld(landMesh);

            // Now go through existing geometries and stitch them to this
            neighbors = {
                right : getNeighboringSquare(gridSquare, -1, 0),
                top : getNeighboringSquare(gridSquare, 0, -1),
                topRight : getNeighboringSquare(gridSquare, -1, -1),
            }
            Object.keys(neighbors).forEach(direction => {
                if (neighbors[direction] in this.bufferGeometries) {
                    let neighborGeometry = this.bufferGeometries[neighbors[direction]];
                    stitchGeometries(neighborGeometry, geometry, direction);
                }
            });
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

    // Generic adds a mesh to the world
    addToWorld(obj: THREE.Object3D) {

        this.tiles.add(obj);
        if (obj.type == 'Mesh') {
            const geometry = (obj as THREE.Mesh).geometry;
            if (geometry.type == 'BufferGeometry') {
                this.bufferGeometries[obj.name] = geometry as THREE.BufferGeometry;
            }
        }
        this.dispatchEvent({type: 'update'});
    }

    // Removes a mesh from the world
    removeFromWorld(name: string) {

        var obj = this.tiles.getObjectByName(name);
        if (obj) {
            this.tiles.remove(obj);
            if (obj.name in this.bufferGeometries) {
                delete this.bufferGeometries[obj.name];
            }
        }
    }

    // Clears the entire world
    removeAllFromWorld() {
        while (this.tiles.children.length) {
            this.tiles.remove(this.tiles.children[0]);
        }
        this.bufferGeometries = {}
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
            .filter(d => d.type == "Mesh")
            .filter(d => {
                var geometry = (<THREE.Mesh>d).geometry;
                /* istanbul ignore else */
                if (geometry) {
                    return frustum.intersectsBox(geometry.boundingBox);
                }
                else {
                    return false;
                }
            });

        // Sort them by distance from center
        var distances = emptyMeshes.map(d => {
            var meshCenter = (<THREE.Mesh>d).geometry.boundingSphere.center.clone();
            meshCenter.setZ(0);
            return {
                id: d.name,
                distance: meshCenter.sub(center).length()
            }
        })
        distances.sort((a, b) => a.distance - b.distance);
        distances.forEach((d, i) => {
            this.load(d.id);
        });

        // Find land or sea meshes that are out of view and replace with an empty one
        var unwantedMeshes = this.tiles.children
            .filter(d => {
                var geometry = (d as THREE.Mesh).geometry;
                /* istanbul ignore else */
                if (geometry) {
                    return !frustum.intersectsBox(geometry.boundingBox);
                }
                else {
                    return false;
                }
            });
        unwantedMeshes.forEach(d => {
            this.removeFromWorld(d.name);
            let emptyGeometry = makeEmptyGeometry(d.name, this.transform, this.scale);
            let emptyMesh = makeWireframe(emptyGeometry, d.name);
            this.addToWorld(emptyMesh);
        })
    }
}

// Generic mesh making functiins

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
