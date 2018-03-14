import * as THREE from 'three';

import { materials, colors } from './constants';
import { parseGridSquare } from './data';
import { coordsToGridref, gridrefToCoords,
    getGridSquareSize, getSurroundingSquares} from './grid';
import { Loader } from './loader';
import { makeTransform, makeScale } from './scale';
import { debounce } from './utils';

// Models the world in which our tiles live

class EventTarget {

    addEventListener: (s: string, f: Function) => void;
    removeEventListener: (s: string, f: Function) => void;
    dispatchEvent: (e: Event) => void;

    constructor() {

        var target = document.createTextNode("");

        // Pass EventTarget interface calls to DOM EventTarget object
        this.addEventListener = target.addEventListener.bind(target);
        this.removeEventListener = target.removeEventListener.bind(target);
        this.dispatchEvent = target.dispatchEvent.bind(target);
    }
}

export class World extends EventTarget {

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

        // Calculate the real origin (i.e. where the world is centred),
        // the world origin (i.e (0, 0, 0))
        // and the transform to get from one to the other
        var realOrigin = gridrefToCoords(gridref);
        var worldOrigin = new THREE.Vector3(0, 0, 0);
        this.transform = makeTransform(realOrigin, worldOrigin, this.scale);

        // Work out our origin as a two-letter square
        var gridSquare = coordsToGridref(realOrigin, 2);
        this.load(gridSquare);
        getSurroundingSquares(gridSquare, 4).forEach(gridref => this.loadEmpty(gridref));

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

                this.replaceEmpty(gridSquare);
                let geometry = parseGridSquare(json, this.transform);
                geometry.computeBoundingBox();

                // Add mesh for this
                let mesh = new THREE.Mesh(geometry, materials.phong(colors.landColor));
                mesh.name = 'land-'+gridSquare;
                this.addToWorld(mesh);

                if (geometry.boundingBox.min.z < 0) {
                    this.addToWorld(this.makeSea(gridSquare));
                }
            })
            .catch((errorResponse) => {
                if (errorResponse.status == 204) {
                    this.replaceEmpty(gridSquare);
                    this.addToWorld(this.makeSea(gridSquare));
                }
                else {
                    console.error(errorResponse);
                }
            });
    }

    // TODO Simple non-this functions makeSea, makeLand, makeEmpty, that each take a geometry
    // and turn into relevant material

    // And this functions makeEmptyGeometry, makeMeshGeometry, that generate the geometry passed

    makeSea(gridSquare: string) {
        let sea = new THREE.Mesh(this.makeSquare(gridSquare),
        materials.meshLambert(colors.seaColor));
        sea.name = 'sea-' + gridSquare;
        return sea;
    }

    makeSquare(gridSquare:string) {

        // Get this grid square, scaled down to local size
        let square = getGridSquareSize(gridSquare).applyMatrix4(makeScale(this.scale));

        // Calculate position of square
        // The half-square addition at the end is to take into account PlaneGeometry
        // is created around the centre of the square and we want it to be bottom-left
        let coords = gridrefToCoords(gridSquare).applyMatrix4(this.transform);
        let geometry = new THREE.PlaneGeometry(square.x, square.y);
        geometry.translate(coords.x + square.x/2, coords.y + square.y/2, coords.z)
        geometry.computeBoundingBox();
        return geometry;

    }

    loadEmpty(gridSquare: string) {

        // Create a mesh out of it and add to map
        let mesh = new THREE.Mesh(this.makeSquare(gridSquare), materials.meshWireFrame(0xFFFFFF));
        mesh.name = 'empty-' + gridSquare;
        this.addToWorld(mesh);

    }

    // TODO Convert to removeFromWorld
    replaceEmpty(gridSquare: string) {

        var toReplace = this.scene.children.filter(d => d.type == "Mesh" && d.name == "empty-" + gridSquare);
        if (toReplace.length) {
            toReplace.forEach(d => this.scene.remove(d));
        }

    }

    addToWorld(mesh: THREE.Mesh) {
        this.scene.add(mesh);
        this.dispatchEvent(new Event('update'));
    }

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

