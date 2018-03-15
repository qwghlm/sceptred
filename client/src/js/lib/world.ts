import * as THREE from 'three';

import { materials, colors } from './constants';
import { makeLandGeometry, makeEmptyGeometry } from './data';
import { coordsToGridref, gridrefToCoords, getSurroundingSquares} from './grid';
import { Loader } from './loader';
import { makeTransform, makeScale } from './scale';
import { debounce } from './utils';

// Models the world in which our tiles live

export class World extends THREE.EventDispatcher {

    loader: Loader; // TODO Make private

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;

    scale: THREE.Vector3; // TODO Make private
    transform: THREE.Matrix4; // TODO Make private

    update: () => void;

    constructor(width: number, height: number) {

        super();

        this.update = debounce(this._update.bind(this), 500);

        // Setup camera
        var camera = this.camera = new THREE.PerspectiveCamera(70, width / height, 1, 10000);
        camera.position.z = Math.min(width, height)*0.75;

        // Setup scene
        var scene = this.scene = new THREE.Scene();

        // Lights
        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1);
        scene.add(light);

        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(-1000, -1000, 1000);
        spotLight.castShadow = true;
        scene.add(spotLight);

        var ambientLight = new THREE.AmbientLight(0x080808);
        scene.add(ambientLight);

        // Set up scale
        const metresPerPixel = 50; // TODO turn into a configurable property?
        const heightFactor = 2;
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
        this.load(gridSquare);
        getSurroundingSquares(gridSquare, 4).forEach(surroundingSquare => {
            let emptyGeometry = makeEmptyGeometry(surroundingSquare, this.transform, this.scale);
            this.addToWorld(makeWireframe(emptyGeometry, "empty-" + surroundingSquare));
        });

    }

    setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    load(gridSquare: string) {

        var url = `/data/${gridSquare}`;
        if (this.loader.isLoading(url)) {
            return;
        }

        this.loader.load(url)
            .then((json) => {

                this.removeFromWorld("empty-" + gridSquare);

                let geometry;

                // If data exists, then make a land geometry
                if (json.data.length) {                
                    geometry = makeLandGeometry(json, this.transform);
                    this.addToWorld(makeLand(geometry, "land-" + gridSquare));
                }

                // If no geometry, or the bounding box is underwater, add sea tile
                if (!geometry || geometry.boundingBox.min.z < 0) {
                    let emptyGeometry = makeEmptyGeometry(gridSquare, this.transform, this.scale)
                    this.addToWorld(makeSea(emptyGeometry, "sea-" + gridSquare));
                }
            })
            .catch((errorResponse) => {
                console.error(errorResponse);
            });
    }

    // Manipulating meshes

    addToWorld(mesh: THREE.Mesh) {
        this.scene.add(mesh);
        this.dispatchEvent({type: 'update'});
    }

    removeFromWorld(name: string) {
        var toReplace = this.scene.children.filter(d => d.type == "Mesh" && d.name == name);
        if (toReplace.length) {
            toReplace.forEach(d => this.scene.remove(d));
        }
    }

    removeAllFromWorld() {
        this.scene.children.filter(d => d.type == "Mesh").forEach(d => this.scene.remove(d));
    }

    // Checking to see

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

        // TODO Get where centre of view intersects z=0 plane and
        // measure distance from there

        const getDistance = (d: THREE.Object3D) => (<THREE.Mesh>d).geometry.boundingSphere.center.length();
        emptyMeshes.sort((a, b) => getDistance(a) - getDistance(b));

        emptyMeshes.forEach(d => {
            var id = d.name.split('-')[1];
            this.load(id);
        });
    }
}


function makeLand(geometry: THREE.BufferGeometry, name: string) {

    let land = new THREE.Mesh(geometry, materials.phong(colors.landColor));
    land.name = name;
    return land;
}

function makeSea(geometry: THREE.Geometry, name: string) {

    let sea = new THREE.Mesh(geometry, materials.meshLambert(colors.seaColor));
    sea.name = name;
    return sea;
}

function makeWireframe(geometry: THREE.Geometry, name: string) {

    let wireframe = new THREE.Mesh(geometry, materials.meshWireFrame(0xFFFFFF));
    wireframe.name = name;
    return wireframe;
}
