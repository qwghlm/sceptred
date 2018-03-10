import * as THREE from 'three';
import * as Modernizr from 'modernizr';

// TODO Fix import error
import { BaseMap } from './map.base';

export class Map extends BaseMap {

    renderer: THREE.WebGLRenderer;

    initializeRenderer() {

        // Add WebGL error message...
        if (!Modernizr.webgl) {
            this.wrapper.removeAttribute("style")
            this.wrapper.innerHTML = "<p>Sorry, this app requires WebGL, which is not supported by your browser. Please use a modern browser such as Chrome, Safari or Firefox.</p>"
            throw Error("Cannot create a WebGL instance, quitting")
        }

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
        this.stats.begin();
        this.renderer.render(this.scene, this.camera);
        this.stats.end();
        super.renderMap();
    }

}
