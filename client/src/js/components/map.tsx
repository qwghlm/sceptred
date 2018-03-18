/// <reference path="../../../../node_modules/@types/three/three-trackballcontrols.d.ts" />

import { h, Component } from "preact";
import * as THREE from 'three';
import TrackballControls from 'three-trackballcontrols';

import Stats from "stats";
import * as Modernizr from 'Modernizr';

import { World } from '../lib/world';

type PropsType = {
    debug: boolean,
    gridReference: string,
    onInitError: () => void,
    onLoadError: (message: string) => void,
    onLoadFinished: () => void,
};
type StateType = {};

export class Map extends Component<PropsType, StateType> {

    world: World;
    renderer: THREE.WebGLRenderer;
    controls: TrackballControls;
    stats: Stats;

    componentDidMount() {

        if (!this.base.querySelector('canvas')) {
            this.props.onInitError();
            return;
        }
        var canvas = this.base.querySelector('canvas') as HTMLCanvasElement;

        var width = this.base.offsetWidth;
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
        var controls = this.controls = new TrackballControls(world.camera, canvas);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        // Shift+ drag to zoom, Ctrl+ drag to pan
        controls.keys = [-1, 16, 17];

        // Set up stats to record
        var stats = this.stats = Stats();
        if (this.props.debug) {
            stats.showPanel(1);
            stats.dom.className = 'debug-stats';
            (this.base.parentNode as HTMLElement).appendChild(stats.dom);
        }

        this.renderWorld();
        this.animateWorld();

        world.addEventListener('update', this.renderWorld.bind(this))
        controls.addEventListener('change', this.renderWorld.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

    }

    shouldComponentUpdate(nextProps: PropsType, nextState: StateType) {
        return this.props.gridReference !== nextProps.gridReference;
    }

    componentWillUpdate(nextProps: PropsType, nextState: StateType) {

        if (nextProps.gridReference.length) {
            try {
                this.world.navigateTo(nextProps.gridReference);
                this.controls.reset();
            }
            catch (e) {
                this.props.onLoadError(e.message);
            }
        }
    }

    onWindowResize() {
        var width = this.base.offsetWidth;
        var height = Math.floor(width * 0.8);
        this.world.setSize(width, height);
        this.renderer.setSize(width, height);
    }

    renderWorld() {
        this.stats.begin();
        this.renderer.render(this.world.scene, this.world.camera);
        this.stats.end();
        this.world.update();
    }

    animateWorld() {
        requestAnimationFrame(this.animateWorld.bind(this));
        this.controls.update();
    }

    // Render function that re-renders the renderer, and calls for an update from the world

    render() {

        if (!Modernizr.webgl) {
            return <div><p>Sorry, this app requires WebGL, which is not supported by your browser. Please use a modern browser such as Chrome, Safari or Firefox.</p></div>;
        }

        return <div class="canvas-wrapper"><canvas></canvas></div>;
    }

}
