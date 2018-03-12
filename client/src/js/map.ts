import * as THREE from 'three';
import * as Modernizr from 'modernizr';

// TODO Fix import error
import { BaseMap } from './lib/map.base';

class DummyStats {
    dom : null;
    begin() {}
    end() {}
    showPanel() {}
}

export class Map extends BaseMap {

    renderer: THREE.WebGLRenderer;
    stats: Stats | DummyStats;

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

    initializeDebugger() {
        if (this.config.debug) {
            this.stats = new Stats();
            this.stats.showPanel(1);
            (<HTMLElement>this.wrapper.parentNode).appendChild( this.stats.dom );
        }
        else {
            this.stats = new DummyStats();
        }
    }

    onWindowResize() {
        super.onWindowResize();
        this.renderer.setSize(this.width, this.height);
    }

    renderMap() {
        this.stats.begin();
        this.renderer.render(this.scene, this.camera);
        this.stats.end();
        super.renderMap();
    }

}
