import * as THREE from 'three';
import * as Modernizr from 'modernizr';
import { h, Component } from "preact";
import Stats from 'stats.js';
import './vendor/TrackballControls';
import { BaseMap } from './lib/map.base';

type PropsType = {
    // debug: boolean,
};
type StateType = {};

// class DummyStats {
//     dom : null;
//     begin() {}
//     end() {}
//     showPanel() {}
// }

export class Map extends Component<PropsType, StateType> {

    renderer: THREE.WebGLRenderer;
    // controls: THREE.TrackballControls;

    componentDidMount() {

        if (!this.base.querySelector('canvas')) {
            return;
        }
        var canvas = this.base.querySelector('canvas') as HTMLCanvasElement;

        var width = this.base.offsetWidth;
        var height = Math.floor(width * 0.8);

        // Setup renderer
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
        // var controls = this.controls = new THREE.TrackballControls(camera, canvas);
        // controls.rotateSpeed = 1.0;
        // controls.zoomSpeed = 1.2;
        // controls.panSpeed = 0.8;
        // controls.noZoom = false;
        // controls.noPan = false;
        // controls.staticMoving = true;
        // controls.dynamicDampingFactor = 0.3;

        // Shift+ drag to zoom, Ctrl+ drag to pan
        // controls.keys = [-1, 16, 17];

        if (true) {
            var stats = new Stats();
            stats.showPanel(1);
            stats.dom.className = 'debug-stats';
            (this.base.parentNode as HTMLElement).appendChild(stats.dom);
        }
        else {
//             this.stats = new DummyStats();
        }


        var world = new BaseMap({
            origin : [325000, 675000],
            width,
            height
        });
        renderer.render(world.scene, world.camera);

        // controls.addEventListener('change', this.renderMap.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

    }

    onWindowResize() {
        var width = this.base.offsetWidth;
        var height = Math.floor(width * 0.8);
        this.renderer.setSize(width, height);
        // TODO Update the world size too
    }

    // animateMap() {
    //     requestAnimationFrame(this.animateMap.bind(this));
    //     // this.controls.update();
    // }

    // TODO
    // Render function that re-renders the renderer, and calls for an update from the world
    //     renderMap() {
    //         this.stats.begin();
    //         this.renderer.render(this.scene, this.camera);
    //         this.stats.end();
    //         super.renderMap();
    //     }

    render() {

        if (!Modernizr.webgl) {
            return <div><p>Sorry, this app requires WebGL, which is not supported by your browser. Please use a modern browser such as Chrome, Safari or Firefox.</p></div>;
        }
        return <div class="canvas-wrapper"><canvas></canvas></div>;
    }
}
