/// <reference types="three" />
import * as THREE from 'three';
import * as Detector from 'three/examples/js/Detector';
import './vendor/TrackballControls';

import { materials, colors } from './lib/constants';
import { makeScale } from './lib/scale';
import { loadGridSquare, parseGridSquare } from './lib/data';
import { coordsToGridref, gridrefToCoords } from './lib/grid';

interface Config {
    origin: number[],
    heightFactor: number,
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
    geometries: Geometries;

    camera: THREE.PerspectiveCamera;
    controls: THREE.TrackballControls;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;

    scale: (x: number, y: number, z: number) => number[]

    constructor(wrapper: HTMLElement, config: Config) {

        // Setup config
        this.config = config;

        // Initialize the wrapper
        this.initializeWrapper(wrapper);
        this.initializeCanvas();

        // Setup scale and load in
        this.scale = makeScale(config.origin[0], config.origin[1], config.heightFactor);
        this.initializeLoad();

        // Render the map
        this.renderMap();

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
        var camera = this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 10000);
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

    initializeLoad() {

        // Work out our origin
        var gridSquare = coordsToGridref(this.config.origin[0], this.config.origin[1], 2);
        this.geometries = {};
        loadGridSquare(gridSquare)
            .then((json) => {
                let geometry = parseGridSquare(json, this.scale);
                this.geometries[gridSquare] = geometry;
                this.addToMap(geometry);
            });

    }

    addToMap(geometry: THREE.Geometry, material='phong', color=colors.landColor) {

        // Compute geometry
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, materials[material](color));
        this.scene.add(mesh);

        // TODO Add sea in a meaningful way

        // Sea geometry
        // const bottomLeft = this.scale(tileOrigin[0], tileOrigin[1], 0);
        // const topRight = this.scale(tileOrigin[0] + gridWidth*squareSize,
        //     tileOrigin[1] + gridHeight*squareSize, 0);
        // var seaGeometry = new THREE.PlaneGeometry(topRight[0] - bottomLeft[0], topRight[1] - bottomLeft[1], 0);

        // var seaMesh = new THREE.Mesh( seaGeometry, materials[material](colors.seaColor) );
        // this.scene.add(seaMesh);

    }

    renderMap() {
        requestAnimationFrame(this.renderMap.bind(this));
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
    }

}
