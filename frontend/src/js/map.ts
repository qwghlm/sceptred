import { materials, colors } from './lib/constants.js';

import * as THREE from 'three';
import * as Detector from 'three/examples/js/Detector';
import * as TrackballControls from './lib/TrackballControls';
THREE.TrackballControls = TrackballControls;

interface Config {
    gridSquares: string[];
}

export class MapView {

    config: Config;

    width: number;
    height: number;

    wrapper: HTMLElement;

    camera: any;
    controls: any;
    scene: any;
    renderer: any;

    constructor(wrapper, config) {

        // Setup config
        this.config = config;

        // Initialize the wrapper
        this.initializeWrapper(wrapper);
        this.initializeCanvas();
        this.loadData();
    }

    initializeWrapper(wrapper) {

        var width = this.width = (wrapper.offsetWidth === 0) ? wrapper.parentNode.offsetWidth : wrapper.offsetWidth;
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
        this.wrapper.appendChild(renderer.domElement);

        // Shadows
        renderer.shadowMap.enabled = true;
        renderer.shadowMapSoft = true;
        renderer.shadowCameraNear = 1;
        renderer.shadowCameraFar = camera.far;
        renderer.shadowCameraFov = 60;
        renderer.shadowMapBias = 0.0025;
        renderer.shadowMapDarkness = 0.5;
        renderer.shadowMapWidth = 1024;
        renderer.shadowMapHeight = 1024;

        this.renderMap();
        this.animateMap();

    }

    loadData() {

        this.config.gridSquares.forEach(grid => {
            fetch(`./data/${grid}.json`)
                .then(response => response.json())
                .then(data => this.populateMap(data));
        });

    }

    populateMap(data) {

        const gridSize = data.meta.gridSize;
        const resolution = 1;

        // Filter out the many many points
        const filter = (_, i) => i%resolution === 0;
        var grid = data.data.filter(filter).map(row => row.filter(filter));
        var gridHeight = grid.length;
        var gridWidth = grid[0].length;

        // Work out the max bound we want the map to occupy
        const maxBound = Math.min(this.width, this.height);

        // Exaggerate height by a factor of 5
        const scaleFactor = 5/(gridSize);

        // From position x, y and z, work out the position on the screen
        const scale = (x, y, z) => {

            // Scale x and y to be a fraction of this, with 0 in the center
            // Y is inverted as Y means south in output terms
            var scaledX = maxBound * (x/gridWidth - 0.5);
            var scaledY = maxBound * (0.5 - y/gridWidth);
            var scaledZ = scaleFactor*z;

            return [scaledX, scaledY, scaledZ];
        };

        // Convert grid into vertices and faces
        var faces = [];
        var vertices = [];

        grid.forEach((row, y) => row.forEach((z, x) => {

            vertices.push(new THREE.Vector3(...scale(x, y, z)));

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

        // Setup land geometry
        var landGeometry = new THREE.Geometry();
        landGeometry.vertices = vertices;
        landGeometry.faces = faces;
        landGeometry.computeFaceNormals();
        landGeometry.computeVertexNormals();

        // Sea geometry
        var [seaWidth, seaHeight] = scale(0, gridHeight, 0);
        var seaGeometry = new THREE.PlaneGeometry(seaWidth*2, seaHeight*2, 0);

        var material = 'phong';
        var landMesh = new THREE.Mesh( landGeometry, materials[material](colors.landColor) );
        this.scene.add(landMesh);

        var seaMesh = new THREE.Mesh( seaGeometry, materials[material](colors.seaColor) );
        this.scene.add(seaMesh);

        this.renderMap();
    }

    renderMap() {
        this.renderer.render(this.scene, this.camera);
    }

    animateMap() {
        requestAnimationFrame(this.animateMap.bind(this));
        this.controls.update();
    }

}
