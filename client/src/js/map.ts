import * as THREE from 'three';
import * as Detector from 'three/examples/js/Detector';
import './vendor/TrackballControls';

import { materials, colors } from './lib/constants';
import { makeTransform } from './lib/scale';
import { loadGridSquare, parseGridSquare } from './lib/data';
import { coordsToGridref, gridrefToCoords } from './lib/grid';

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
    geometries: Geometries;

    camera: THREE.PerspectiveCamera;
    controls: THREE.TrackballControls;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;

    transform: THREE.Matrix4;

    constructor(wrapper: HTMLElement, config: Config) {

        // Setup config
        this.config = config;

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
        var worldOrigin = new THREE.Vector3(this.config.origin[0], this.config.origin[1], 0);
        var modelOrigin = new THREE.Vector3(0, 0, 0);
        var scale = new THREE.Vector3(1/metresPerPixel, 1/metresPerPixel, this.config.heightFactor/metresPerPixel);
        this.transform = makeTransform(worldOrigin, modelOrigin, scale);
    }

    initializeLoad() {

        // Work out our origin
        var gridSquare = coordsToGridref(this.config.origin[0], this.config.origin[1], 2);
        this.geometries = {};
        this.load(gridSquare);

    }

    load(gridSquare: string) {
        loadGridSquare(gridSquare)
            .then((json) => {
                let geometry = parseGridSquare(json, this.transform);
                // this.geometries[gridSquare] = geometry;
                this.addToMap(geometry);
            });

        var seaObj = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.01);
        var seaGeometry = new THREE.PlaneGeometry(10000, 10000)
        var seaMaterial = new THREE.MeshBasicMaterial( {color: 0x000033 } )
        this.scene.add(new THREE.Mesh(seaGeometry, seaMaterial));

    }

    addToMap(geometry: THREE.BufferGeometry, material='phong', color=colors.landColor) {

        const mesh = new THREE.Mesh(geometry, materials[material](color));
        this.scene.add(mesh);
        this.renderMap();

    }

    renderMap() {
        this.renderer.render(this.scene, this.camera);
        this.doCheck();
    }

    animateMap() {
        requestAnimationFrame(this.animateMap.bind(this));
        this.controls.update();
    }


    doCheck() {

        // TODO Debounce this function
        var inverseTransform = new THREE.Matrix4();
        inverseTransform.getInverse(this.transform);

        var raycaster = new THREE.Raycaster();

        var extremes = [
            new THREE.Vector2(1, 1),
            new THREE.Vector2(1, -1),
            new THREE.Vector2(-1, -1),
            new THREE.Vector2(-1, 1),
        ]

        var corners = extremes.map(v => {

            // Work out where each corner intersects the plane
            raycaster.setFromCamera(v, this.camera );
            var intersects = raycaster.intersectObject(this.scene.children[3], false);

            if (intersects.length === 0) {
                // Er...
                return false;
            }
            else {
                var coords = new Float32Array([
                    intersects[0].point.x,
                    intersects[0].point.y,
                    intersects[0].point.z,
                ]);
                var buffer = new THREE.BufferAttribute(coords, coords.length);
                return inverseTransform.applyToBufferAttribute(buffer).array;
            }
        });
        console.log(corners);
    }


}
