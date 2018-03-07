import * as THREE from 'three';
import * as Detector from 'three/examples/js/Detector';
import './vendor/TrackballControls';

import { materials, colors } from './lib/constants';
import { parseGridSquare } from './lib/data';
import { Loader } from './lib/loader';
import { makeTransform, makeScale } from './lib/scale';
import { coordsToGridref, gridrefToCoords,
    getGridSquareSize, getSurroundingSquares} from './lib/grid';
import { debounce } from './lib/utils';

interface Config {
    origin: number[],
    heightFactor: number, // TODO
    debug: boolean,
}

interface Geometries {
    [propName: string]: THREE.Geometry;
}

export class MapView {

    config: Config;

    width: number;
    height: number;

    wrapper: HTMLElement;
    loader: Loader;
    geometries: Geometries;

    camera: THREE.PerspectiveCamera;
    controls: THREE.TrackballControls;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;

    scale: THREE.Matrix4;
    transform: THREE.Matrix4;

    constructor(wrapper: HTMLElement, config: Config) {

        // Setup config
        this.config = config;

        this.updateMap = debounce(this.updateMap.bind(this), 500);

        // Initialize the wrapper
        this.initializeWrapper(wrapper);
        this.initializeCanvas();

        this.initializeTransform();
        this.initializeLoad();

        // Render the map
        this.renderMap();
        this.animateMap();

    }

    initializeWrapper(wrapper: HTMLElement) {

        var width = this.width = (wrapper.offsetWidth === 0) ? (<HTMLElement> wrapper.parentNode).offsetWidth : wrapper.offsetWidth;
        var height = this.height = 0.8*width;

        wrapper.style.height = height + 'px';
        this.wrapper = wrapper;

        // TODO: Auto-resize on window resize
    }

    initializeCanvas() {

        // Add WebGL message...
        if (!Detector.webgl) {
            Detector.addGetWebGLMessage();
            return; // TODO Raise an exception?
        }

        // Setup camera
        var camera = this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 1, 10000);
        camera.position.z = Math.min(this.width, this.height);

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

        // Renderer
        var renderer = this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this.width, this.height);
        renderer.setClearColor(0x444444);
        renderer.shadowMap.enabled = true;
        this.wrapper.appendChild(renderer.domElement);

    }

    // Setup transform from global to screen coordinates
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

    load(gridSquare: string) {

        var url = `/data/${gridSquare}`;
        if (this.loader.isLoading(url)) {
            return;
        }

        this.loader.load(url)
            .then((json) => {

                this.replaceEmpty(gridSquare);

                let geometry = parseGridSquare(json, this.transform);
                let mesh = new THREE.Mesh(geometry, materials.phong(colors.landColor));
                mesh.name = 'filled-'+gridSquare;
                this.addToMap(mesh);
            });

    }

    loadEmpty(gridSquare: string) {

        // Get this grid square, scaled down to local size
        let square = getGridSquareSize(gridSquare).applyMatrix4(this.scale);

        // Calculate position of square
        // The half-square addition at the end is to take into account PlaneGeometry
        // is created around the centre of the square and we want it to be bottom-left
        let coords = gridrefToCoords(gridSquare).applyMatrix4(this.transform);
        let geometry = new THREE.PlaneGeometry(square.x, square.y);
        geometry.translate(coords.x + square.x/2, coords.y + square.y/2, coords.z)

        // Create a mesh out of it and add to map
        let mesh = new THREE.Mesh(geometry, materials.meshWireFrame(0xFFFFFF));
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
        this.renderer.render(this.scene, this.camera);
        this.updateMap();
    }

    animateMap() {
        requestAnimationFrame(this.animateMap.bind(this));
        this.controls.update();
    }

    updateMap() {

        var emptyMeshes = this.scene.children
            .filter(d => d.type == "Mesh" && d.geometry.type == "PlaneGeometry" && d.name.split('-')[0] == 'empty');

        emptyMeshes.forEach(d => {
            var id = d.name.split('-')[1];
            this.load(id);
        })

    }


}
