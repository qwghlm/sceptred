/// <reference types="three" />
import * as THREE from 'three';
import * as Detector from 'three/examples/js/Detector';
import './vendor/TrackballControls';

import { materials, colors } from './lib/constants';
import { linearScale } from './lib/scale';
import { coordsToGridref, gridrefToCoords } from './lib/grid';

interface Config {
    origin: number[],
    heightFactor: number,
    debug: boolean,
}

interface GridData {
    meta: {
        squareSize: number,
        gridReference: string
    },
    data: number[][],
}

export class MapView {

    config: Config;

    width: number;
    height: number;

    wrapper: HTMLElement;

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
        this.initializeScale();

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

    initializeScale() {

        const metresPerPixel = 50;

        var xScale = linearScale(this.config.origin[0], 0, 1/metresPerPixel);
        var yScale = linearScale(this.config.origin[1], 0, -1/metresPerPixel);
        var zScale = linearScale(0, 0, this.config.heightFactor/metresPerPixel);

        this.scale = (x: number, y: number, z: number) => {
            return [xScale(x), yScale(y), zScale(z)];
        };

        var gridSquare = coordsToGridref(this.config.origin[0], this.config.origin[1], 2);
        this.loadData(gridSquare);

    }

    loadData(gridSquare: string) {

        // Start loader here

        fetch(`/static/data/${gridSquare}.json`)
            .then(response => response.json())
            .then(data => this.populateMap(data));

        // End loader here

    }

    populateMap(data: GridData) {

        // Start parser here

        // Filter out the many many points
        const resolution = 1;
        const filter = (n: any, i: number) => i%resolution === 0;
        var grid = data.data.filter(filter).map(row => row.filter(filter));

        // End parser here

        const tileOrigin = gridrefToCoords(data.meta.gridReference);
        const squareSize = data.meta.squareSize;

        // Start scaler here

        var gridHeight = grid.length;
        var gridWidth = grid[0].length;

        // Convert grid into vertices and faces
        var faces: THREE.Face3[] = [];
        var vertices: THREE.Vector3[] = [];

        grid.forEach((row, y) => row.forEach((z, x) => {

            var coords = this.scale(
                tileOrigin[0] + x*squareSize,
                tileOrigin[1] + y*squareSize,
                z);

            vertices.push(new THREE.Vector3(...coords));

            // If this point can form top-left of a square, add the two
            // triangles that are formed by that square
            if (x < gridWidth - 1 && y < gridHeight - 1) {

                // Work out index of this point in the vertices array
                var i = x + gridWidth*y;

                // First triangle: top-left, top-right, bottom-left
                faces.push(new THREE.Face3(i, i+1, i+gridWidth));

                // Second triangle: top-right, bottom-right, bottom-left
                faces.push(new THREE.Face3(i+1, i+gridWidth+1, i+gridWidth));
            }

        }));

        // End scaler here

        // Setup land geometry
        var landGeometry = new THREE.Geometry();
        landGeometry.vertices = vertices;
        landGeometry.faces = faces;
        landGeometry.computeFaceNormals();
        landGeometry.computeVertexNormals();

        // Sea geometry
        const bottomLeft = this.scale(tileOrigin[0], tileOrigin[1], 0);
        const topRight = this.scale(tileOrigin[0] + gridWidth*squareSize,
            tileOrigin[1] + gridHeight*squareSize, 0);

        var seaGeometry = new THREE.PlaneGeometry(topRight[0] - bottomLeft[0], topRight[1] - bottomLeft[1], 0);

        var material = 'phong';
        var landMesh = new THREE.Mesh( landGeometry, materials[material](colors.landColor) );
        this.scene.add(landMesh);

        var seaMesh = new THREE.Mesh( seaGeometry, materials[material](colors.seaColor) );
        this.scene.add(seaMesh);

        requestAnimationFrame(this.renderMap.bind(this));
    }

    renderMap() {
        this.renderer.render(this.scene, this.camera);
    }

    animateMap() {
        requestAnimationFrame(this.animateMap.bind(this));
        this.controls.update();
    }

}
