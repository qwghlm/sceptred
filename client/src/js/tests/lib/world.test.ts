import { World } from '../../lib/world';

// Mocks are functions so that we don't use same copy of data over and over again
const mockMetadata = (gridReference) => ({
    squareSize: 50,
    gridReference
});
const mockData = (gridReference) => ({
    meta: mockMetadata(gridReference),
    heights: [[4, 4, 4], [5, 5, 5], [6, 6, 6]],
});
const mockBlankData = (gridReference) => ({
    meta: mockMetadata(gridReference),
    heights: [],
});

// Forces all promises in queue to flush, so we can get e.g. a load result
function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

// Mock for the loader
jest.mock('../../lib/loader', () => {
    class Loader{
        // Mock loader returns dummy data for every square except NT37, which is empty
        load(url) {
            var gridSquare = url.slice(-4);
            if (url.match(/NT37/)) {
                return new Promise(
                    (resolve, reject) => resolve(mockBlankData(gridSquare))
                )
            }
            return new Promise(
                (resolve, reject) => resolve(mockData(gridSquare))
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
const landFilter = d => d.geometry.type == 'BufferGeometry';
const seaFilter = d => d.geometry.type == 'PlaneGeometry' && d.material.type == 'MeshPhongMaterial';
const emptyFilter = d => d.geometry.type == 'PlaneGeometry' && d.material.type == 'MeshBasicMaterial';

test('World works', async () => {

    // Create a new world
    var world = new World(625, 500);

    // Check map is loaded
    expect(world.camera.aspect).toBe(1.25);

    // Load a grid square
    world.navigateTo("NT27");
    await flushPromises();

    // Trigger these manually as we do not have a renderer
    world.camera.updateMatrixWorld();
    const updateGeometry = (d) => {
        d.geometry.computeBoundingSphere();
        d.geometry.computeBoundingBox();
    }
    world.tiles.children.forEach(d => {
        updateGeometry(d);
    });

    // There should be one filled land mesh and 8 empty meshes (3x3 grid)
    var tiles = world.tiles.children;
    expect(tiles.filter(landFilter).length).toBe(1);
    expect(tiles.filter(seaFilter).length).toBe(0);
    expect(tiles.filter(emptyFilter).length).toBe(8);

    // Trigger the update function manually
    world._update();
    await flushPromises();

    // There should now be 9 proper meshes in the camera view
    // and 16 empty meshes surrounding them to make a 5x5 grid
    tiles = world.tiles.children;
    expect(tiles.filter(landFilter).length).toBe(8);
    expect(tiles.filter(seaFilter).length).toBe(1);
    expect(tiles.filter(emptyFilter).length).toBe(16);

    // Zoom in and trigger another update
    world.camera.position.z -= 100;
    world.camera.updateMatrixWorld();
    world._update();
    await flushPromises();

    tiles = world.tiles.children;
    expect(tiles.filter(landFilter).length).toBe(4);
    expect(tiles.filter(seaFilter).length).toBe(1);
    expect(tiles.filter(emptyFilter).length).toBe(24);

    world.removeAllFromWorld();
    expect(world.tiles.children.length).toBe(0);

    // Finally trigger a window resize to half the size, and test the resize handler
    world.setSize(640, 480);
    expect(world.camera.aspect).toEqual(4/3);

});
