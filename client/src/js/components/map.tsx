import * as React from "react";
import * as ReactDOM from "react-dom";

import * as THREE from 'three';
require('../vendor/trackballcontrols.js');

import Stats from "stats";

import { MapInstructions, MapFullScreenButton } from './map.components';
import { World } from '../lib/world';
import { webglEnabled, getFullScreenPrefix, getFullScreenFunction } from '../lib/utils';

// Properties that can be passed to map

type MapProps = {
    debug: boolean,
    gridReference: string,
    onInitError: () => void,
    onLoadError: (message: string) => void,
};
type MapState = {};

// Map class
export class Map extends React.Component<MapProps, {}> {

    world: World;
    renderer: THREE.WebGLRenderer;
    controls: THREE.TrackballControls;
    stats: Stats;

    // When map loads, render the webgl 3D context inside the canvas
    componentDidMount() {

        var base = ReactDOM.findDOMNode(this) as HTMLElement;

        // If no canvas, i.e. webgl doesn't exist, fire error
        if (!base.querySelector('canvas')) {
            this.props.onInitError();
            return;
        }

        // Setup canvas
        var canvas = base.querySelector('canvas') as HTMLCanvasElement;
        var width = base.offsetWidth;
        var height = Math.floor(width * 0.8);

        // Setup world & renderer
        var world = this.world = new World(width, height);
        var renderer = this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: canvas,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.setClearColor(0x444444);
        renderer.shadowMap.enabled = true;

        // Setup trackball controls
        var controls = this.controls = new THREE.TrackballControls(world.camera, canvas);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        // Rotate (ctrl), zoom (shift), pan (none, default)
        controls.keys = [16, 17, -1];

        // Set up stats to record
        var stats = this.stats = Stats();
        if (this.props.debug) {
            stats.showPanel(1);
            stats.dom.className = 'debug-stats';
            (base.parentNode as HTMLElement).appendChild(stats.dom);
        }

        // Render and animate
        this.renderWorld({type:"init"});
        this.animateWorld();

        // Start listening to events

        // Re-render if world updates, or if controls move camera
        world.addEventListener('update', this.renderWorld.bind(this))
        controls.addEventListener('change', this.renderWorld.bind(this));

        // Resize the canvas if window resizes
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        if (this.props.gridReference.length) {
            this.navigateTo(this.props.gridReference);
        }

    }

    // Only update the world if grid reference changes
    shouldComponentUpdate(nextProps: MapProps, nextState: MapState) {
        return this.props.gridReference !== nextProps.gridReference;
    }

    // If a grid reference is supplied...
    componentWillUpdate(nextProps: MapProps, nextState: MapState) {

        // Try loading it and navigating to it
        if (nextProps.gridReference.length) {

            // If previously no gridref, then wait for animation to complete
            let animationTime = this.props.gridReference.length ? 0: 400;
            setTimeout(() => this.navigateTo(nextProps.gridReference), animationTime);
        }
    }

    // Navigate to a new location on the map
    navigateTo(gridReference) {

        try {
            this.world.navigateTo(gridReference);
            this.controls.reset();
        }

        // If it fails, trigger an error
        catch (e) {
            this.props.onLoadError(e.message);
        }
    }

    // Renders the world, and updates the stats while we are at it
    renderWorld(e: {type: string}) {
        this.stats.begin();
        this.world.updateLevelsOfDetail();
        this.renderer.render(this.world.scene, this.world.camera);
        this.stats.end();
        this.world.update();
    }

    // Check in on the controls
    animateWorld() {
        requestAnimationFrame(this.animateWorld.bind(this));
        this.controls.update();
    }

    // Simple resizer
    onWindowResize = (e) => {

        var width, height;
        const prefix = getFullScreenPrefix();
        const fullScreenElementID = (prefix == "") ? 'fullscreenElement' : prefix + 'FullscreenElement';
        if (document[fullScreenElementID] === null) {
            var base = ReactDOM.findDOMNode(this) as HTMLElement;
            width = base.offsetWidth;
            height = Math.floor(width * 0.8);
        }
        else {
            width = window.innerWidth;
            height = window.innerHeight;
        }
        this.world.setSize(width, height);
        this.renderer.setSize(width, height);
    }

    onFullScreen = (e) => {

        const canvas = ReactDOM.findDOMNode(this).querySelector('canvas');
        const fullscreenFunctionName = getFullScreenFunction()
        if (canvas === null || fullscreenFunctionName === false) {
            return;
        }
        if (fullscreenFunctionName in canvas) {
            canvas[fullscreenFunctionName]();
        }
        else {
            console.error(fullscreenFunctionName + " not available on canvas");
        }
    }

    // Render function that outputs the canvas renderer
    render() {

        if (!webglEnabled()) {
            return <div><p>Sorry, this app requires WebGL, which is not supported by your browser. Please use a modern browser such as Chrome, Safari or Firefox.</p></div>;
        }
        return <div className={"canvas-wrapper " + (this.props.gridReference.length ? "" : "inactive")}>

            <div className="canvas-wrapper-inner">

                <canvas></canvas>

                <MapFullScreenButton onFullScreen={this.onFullScreen}/>

            </div>

            <MapInstructions />

        </div>;

    }
}

