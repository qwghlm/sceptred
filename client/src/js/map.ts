import * as THREE from 'three';
import * as Detector from 'three/examples/js/Detector';
import { BaseMap } from './map.base';

export class Map extends BaseMap {

    renderer: THREE.WebGLRenderer;

    initializeWorld() {

        // Add WebGL message...
        // TODO Maybe a less shonky way of this
        if (!Detector.webgl) {
            Detector.addGetWebGLMessage();
            throw Error("Cannot creat a WebGL instance, quitting")
            // TODO Catch this result properly
        }

        super.initializeWorld()

    }

    initializeRenderer() {

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

    renderMap() {
        this.renderer.render(this.scene, this.camera);
        super.renderMap();
    }

}
