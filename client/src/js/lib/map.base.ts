import * as THREE from 'three';
import * as Stats from 'stats.js';
import '../vendor/TrackballControls';

import { materials, colors } from './constants';
import { parseGridSquare } from './data';
import { coordsToGridref, gridrefToCoords,
    getGridSquareSize, getSurroundingSquares} from './grid';
import { Loader } from './loader';
import { makeTransform, makeScale } from './scale';
import { debounce } from './utils';

interface Config {
    origin: number[],
    heightFactor: number, // TODO
    debug: boolean,
}

interface Geometries {
    [propName: string]: THREE.Geometry;
}

export class BaseMap {

    config: Config;

    width: number;
    height: number;

    loaded: boolean;

    wrapper: HTMLElement;
    loader: Loader;
    geometries: Geometries; // TODO Need this?

    camera: THREE.PerspectiveCamera;
    controls: THREE.TrackballControls;
    scene: THREE.Scene;

    scale: THREE.Matrix4;
    transform: THREE.Matrix4;

    updateMap: () => void;

    constructor(wrapper: HTMLElement, config: Config) {

        // Setup config
        this.config = config;
        this.loaded = false;

        this.updateMap = debounce(this._updateMap.bind(this), 500);

        // Initialize the view and the renderer
        this.initializeWrapper(wrapper);
        this.initializeWorld();
        try {
            this.initializeRenderer();
        }
        catch (error) {
            console.error("Error initialising renderer, aborting load");
            return;
        }
        this.initializeDebugger();

        // Initialize the transforms within the world, and load
        this.initializeTransform();
        this.initializeLoad();

        // Render the map
        this.renderMap();
        this.animateMap();
        this.loaded = true;

    }

    initializeWrapper(wrapper: HTMLElement) {

        this.wrapper = wrapper;
        this.sizeWrapper();
    }

    initializeWorld() {

        // Setup camera
        var camera = this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 1, 10000);
        camera.position.z = Math.min(this.width, this.height)*0.75;

        // Setup trackball controls
        var controls = this.controls = new THREE.TrackballControls(camera, this.wrapper);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        // Shift+ drag to zoom, Ctrl+ drag to pan
        controls.keys = [-1, 16, 17];
        controls.addEventListener('change', this.renderMap.bind(this));

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

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

    }

    initializeRenderer() {
        // This must be overridden
    }

    initializeDebugger() {
        // This must be overridden
    }


    // Setup transform from real-world to 3D world coordinates
    initializeTransform() {
        const metresPerPixel = 50; // TODO

        // Calculate the world origin (i.e. where the world is centred),
        // the model origin (i.e (0, 0, 0))
        // and the scale to get from one to the other
        var worldOrigin = new THREE.Vector3(this.config.origin[0], this.config.origin[1], 0);
        var modelOrigin = new THREE.Vector3(0, 0, 0);
        var scale = new THREE.Vector3(1/metresPerPixel, 1/metresPerPixel, this.config.heightFactor/metresPerPixel);

        this.scale = makeScale(scale);
        this.transform = makeTransform(worldOrigin, modelOrigin, scale);
    }

    initializeLoad() {

        this.loader = new Loader();

        // Work out our origin
        var coords = new THREE.Vector3(this.config.origin[0], this.config.origin[1], 0)
        var gridSquare = coordsToGridref(coords, 2);
        this.load(gridSquare);
        getSurroundingSquares(gridSquare, 2).forEach(gridref => this.loadEmpty(gridref));

    }

    sizeWrapper() {
        var width = this.width = (this.wrapper.offsetWidth === 0) ? (<HTMLElement>this.wrapper.parentNode).offsetWidth : this.wrapper.offsetWidth;
        var height = this.height = 0.8*width;
        this.wrapper.style.height = height + 'px';
    }

    onWindowResize() {
        this.sizeWrapper();
        this.camera.aspect = this.width / this.height;
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
                this.addToMap(mesh);

                if (geometry.boundingBox.min.z < 0) {
                    let sea = new THREE.Mesh(this.makeSquare(gridSquare),
                        materials.meshLambert(colors.seaColor));
                    sea.name = 'sea-' + gridSquare;
                    this.addToMap(sea);
                }
            });
    }

    makeSquare(gridSquare:string) {

        // Get this grid square, scaled down to local size
        let square = getGridSquareSize(gridSquare).applyMatrix4(this.scale);

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
        this.addToMap(mesh);

    }

    replaceEmpty(gridSquare: string) {

        var toReplace = this.scene.children.filter(d => d.type == "Mesh" && d.name == "empty-" + gridSquare);
        if (toReplace.length) {
            toReplace.forEach(d => this.scene.remove(d));
        }

    }

    addToMap(mesh: THREE.Mesh) {
        this.scene.add(mesh);
        this.renderMap();
    }

    renderMap() {
        this.updateMap();
    }

    animateMap() {
        requestAnimationFrame(this.animateMap.bind(this));
        this.controls.update();
    }

    // Not usually called directly, but called by debounced version
    _updateMap() {

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
