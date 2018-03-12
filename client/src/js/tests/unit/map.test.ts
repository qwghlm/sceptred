import { BaseMap } from '../../lib/map.base';

const origin = [325000, 675000]; // Center of NT27
const gridReference = 'NT';
const mockData = {
    meta: {
        squareSize: 50,
        gridReference
    },
    data: [[-2.1, -2.1], [5, 5]],
}

//
jest.mock('../../lib/loader', () => {
    class Loader{
        isLoading() { return false; }
        load() {
            return new Promise(
                (resolve, reject) => resolve(mockData)
            )
        }
    };
    return {Loader}
});

// Setup Jest
jest.useFakeTimers();

// Shim for element dimension props
Object.defineProperties(window.HTMLElement.prototype, {
  offsetLeft: {
    get: function() { return parseFloat(window.getComputedStyle(this).marginLeft) || 0; }
  },
  offsetTop: {
    get: function() { return parseFloat(window.getComputedStyle(this).marginTop) || 0; }
  },
  offsetHeight: {
    get: function() { return parseFloat(window.getComputedStyle(this).height) || 0; }
  },
  offsetWidth: {
    get: function() { return parseFloat(window.getComputedStyle(this).width) || 0; }
  }
});

// Filters uses to filter out land, sea and empty meshes
const landFilter = d => d.name.split('-')[0] == 'land';
const emptyFilter = d => d.name.split('-')[0] == 'empty'

test('BaseMap works', async () => {

    // Create a fake element and add the map to it
    const testElem = document.createElement('div');
    testElem.style.width = "640px";
    document.body.appendChild(testElem);
    var view = await new BaseMap(
        testElem,
        {
            origin : origin,
            heightFactor: 1,
            debug : false,
        }
    );

    // Trigger these manually as we do not have a renderer
    view.camera.updateMatrixWorld();
    view.scene.children.forEach(d => {
        if (d.geometry) {
            d.geometry.computeBoundingSphere();
            d.geometry.computeBoundingBox();
        }
    });

    // Check map is loaded
    expect(view.loaded).toBe(true);
    expect(view.width).toBe(640);
    expect(view.height).toBe(512);

    // There should be one filled land mesh and 24 empty meshes (5x5 grid)
    var meshes = view.scene.children.filter(d => d.type == "Mesh");
    expect(meshes.filter(landFilter).length).toBe(1);
    expect(meshes.filter(emptyFilter).length).toBe(24);

    // Run times, which triggers the updateMap() function
    await jest.runAllTimers();

    // There should now be more proper meshes in the camera view (5x3)
    var meshes = view.scene.children.filter(d => d.type == "Mesh");
    expect(meshes.filter(landFilter).length).toBe(15);
    expect(meshes.filter(emptyFilter).length).toBe(10);

    // Finally trigger a window resize to half the size, and test the resize handler
    const resizeEvent = document.createEvent('Event');
    resizeEvent.initEvent('resize', true, true);
    testElem.style.width = "320px";
    global.window.dispatchEvent(resizeEvent);
    expect(view.width).toBe(320);
    expect(view.height).toBe(256);

});
