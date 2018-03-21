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

// Geometries lookup

interface Geometries {
    [propName: string]: THREE.Geometry | THREE.BufferGeometry;
}

// Models the world in which our tiles live

export class World extends THREE.EventDispatcher {

    private loader: Loader;
    private scale: THREE.Vector3;
    private transform: THREE.Matrix4;
    private geometries: Geometries;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
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
        camera.position.z = 384;

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

        // Set up scale
        this.scale = new THREE.Vector3(1/metresPerPixel, 1/metresPerPixel, heightFactor/metresPerPixel);

        // Set up loader
        this.geometries = {};
        this.loader = new Loader();

        this.navigateTo("NN37")

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
        return this.load(gridSquare, 0);

    }

    // Resizes the world e.g. if the window has resized
    setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    // Load the gridsquare
    load(gridSquare: string, delay: number) {

        var url = `/data/${gridSquare}`;

        // Skip if already loading
        if (this.loader.isLoading(url)) {
            return Promise.resolve();
        }

        // Set load and error listeners
        return new Promise(resolve => setTimeout(resolve, delay))
            .then(() => this.loader.load(url))
            .then((json) => this.onLoad(json))
            .catch((errorResponse) => {
                console.error(errorResponse);
            });
    }

    // Manipulating meshes

    // Loads the grid data from the API
    onLoad(grid: GridData) {

        let gridSquare = grid.meta.gridReference;
        this.removeFromWorld("empty-" + gridSquare);

        var addSeaTile = true;

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
                if (neighbors[direction] in this.geometries) {
                    var neighborGeometry = this.geometries[neighbors[direction]];
                    if (neighborGeometry.isBufferGeometry !== undefined) {
                        stitchGeometries(geometry, neighborGeometry as THREE.BufferGeometry, direction);
                    }
                }
            });

            // Add the geometry to the world
            this.addToWorld(makeLand(geometry, "land-" + gridSquare));

            // Now go through existing geometries and stitch them to this
            neighbors = {
                right : getNeighboringSquare(gridSquare, -1, 0),
                top : getNeighboringSquare(gridSquare, 0, -1),
                topRight : getNeighboringSquare(gridSquare, -1, -1),
            }
            Object.keys(neighbors).forEach(direction => {
                if (neighbors[direction] in this.geometries) {
                    var neighborGeometry = this.geometries[neighbors[direction]];
                    if (neighborGeometry.isBufferGeometry !== undefined) {
                        stitchGeometries(neighborGeometry as THREE.BufferGeometry, geometry, direction);
                    }
                }
            });

            // Don't add sea tile if lowest point in box is above 0
            if (geometry.boundingBox.min.z > 0) {
                addSeaTile = false;
            }
        }

        // If no geometry, or the bounding box has an underwater section, add sea tile
        if (addSeaTile) {
            let emptyGeometry = makeEmptyGeometry(gridSquare, this.transform, this.scale)
            this.addToWorld(makeSea(emptyGeometry, "sea-" + gridSquare));
        }

        // Queue the surrounding squares
        getSurroundingSquares(gridSquare, 1).forEach(surroundingSquare => {
            if (!(surroundingSquare in this.geometries)) {
                var emptyMeshName = "empty-" + surroundingSquare;
                if (this.scene.children.filter(d => d.name == emptyMeshName).length === 0) {
                    let emptyGeometry = makeEmptyGeometry(surroundingSquare, this.transform, this.scale);
                    this.addToWorld(makeWireframe(emptyGeometry, emptyMeshName));
                }
            }
        });

    }

    // Generic adds a mesh to the world
    addToWorld(mesh: THREE.Mesh) {
        this.geometries[mesh.name.split('-')[1]] = mesh.geometry;
        this.scene.add(mesh);
        this.dispatchEvent({type: 'update'});
    }

    // Removes a mesh from the world
    removeFromWorld(name: string) {
        var toReplace = this.scene.children.filter(d => d.type == "Mesh" && d.name == name);
        if (toReplace.length) {
            toReplace.forEach(d => {
                this.scene.remove(d);
                delete this.geometries[name.split('-')[1]];
            });
        }
    }

    // Clears the entire world
    removeAllFromWorld() {
        this.scene.children.filter(d => d.type == "Mesh").forEach(d => this.scene.remove(d));
        this.geometries = {}
    }

    // Checking to see if any unloaded meshes can be loaded in
    _update() {

        // Calculate the frustum of this camera
        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(
            this.camera.projectionMatrix, this.camera.matrixWorldInverse));

        // Find every empty mesh on screen that is displayed in the camera
        var emptyMeshes = this.scene.children
            .filter(d => d.type == "Mesh" && (<THREE.Mesh>d).geometry.type == "PlaneGeometry" && d.name.split('-')[0] == 'empty')
            .filter(d => {
                var geometry = (<THREE.Mesh>d).geometry;
                if (geometry) {
                    return frustum.intersectsBox(geometry.boundingBox);
                }
                return false;
            });

        // Work out where the center of the screen coincides with the tilemap
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        var intersects = raycaster.intersectObjects(this.scene.children);
        var center = intersects[0].point;
        center.setZ(0);

        // Sort them by distance from center
        var distances = emptyMeshes.map(d => {
            var meshCenter = (<THREE.Mesh>d).geometry.boundingSphere.center.clone();
            meshCenter.setZ(0);
            return {
                id: d.name.split('-')[1],
                distance: meshCenter.sub(center).length();
            }
        })

        distances.sort((a, b) => a.distance - b.distance);
        distances.forEach((d, i) => {
            this.load(d.id, Math.floor(i/5)*200);
        });
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

    let sea = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
        color: seaColor,
        transparent: true
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
