import { World } from '../../lib/world';

// Mocks are functions so that we don't use same copy of data over and over again
const mockMetadata = (gridReference) => ({
    squareSize: 50,
    gridReference
});
const mockData = (gridReference) => ({
    meta: mockMetadata(gridReference),
    data: [[4, 4, 4], [5, 5, 5], [6, 6, 6]],
});

// Mock for the loader
jest.mock('../../lib/loader', () => {
    class Loader{
        isLoading() { return false; }

        // Mock loader returns dummy data for every square except NT37, which is empty
        load(url) {
            var gridSquare = url.slice(-4);
            if (url.match(/NT37/)) {
                return new Promise(
                    (resolve, reject) => resolve({meta: mockMetadata(gridSquare), data: []})
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
const landFilter = d => d.name.split('-')[0] == 'land';
const emptyFilter = d => d.name.split('-')[0] == 'empty'
const seaFilter = d => d.name.split('-')[0] == 'sea'

test('World works', async () => {

    // Create a new world
    var world = new World(640, 512);

    // Check map is loaded
    expect(world.camera.aspect).toBe(1.25);

    // Load a grid square
    await world.navigateTo("NT27");

    // Trigger these manually as we do not have a renderer
    world.camera.updateMatrixWorld();
    world.scene.children.forEach(d => {
        if (d.geometry) {
            d.geometry.computeBoundingSphere();
            d.geometry.computeBoundingBox();
        }
    });

    // There should be one filled land mesh and 24 empty meshes (5x5 grid)
    var meshes = world.scene.children.filter(d => d.type == "Mesh");
    expect(meshes.filter(landFilter).length).toBe(1);
    expect(meshes.filter(seaFilter).length).toBe(0);
    expect(meshes.filter(emptyFilter).length).toBe(80);

    // Trigger the update function manually
    world.update();
    await jest.runAllTimers();

    // There should now be 15 proper meshes in the camera view (4x4 grid, but one is empty)
    var meshes = world.scene.children.filter(d => d.type == "Mesh");
    expect(meshes.filter(landFilter).length).toBe(15);
    expect(meshes.filter(seaFilter).length).toBe(1);
    expect(meshes.filter(emptyFilter).length).toBe(65);

    world.removeAllFromWorld();
    var meshes = world.scene.children.filter(d => d.type == "Mesh");
    expect(meshes.length).toBe(0);

    // Finally trigger a window resize to half the size, and test the resize handler
    world.setSize(640, 480);
    expect(world.camera.aspect).toEqual(4/3);
});
