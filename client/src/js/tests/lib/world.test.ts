import { World } from '../../lib/world';

const gridReference = 'NT27';
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

test('World works', async () => {

    // Create a new world
    var world = new World(640, 512);

    // Check map is loaded
    expect(world.camera.aspect).toBe(1.25);

    // Load a grid square
    await world.navigateTo(gridReference);

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
    expect(meshes.filter(emptyFilter).length).toBe(80);

    // Trigger the update function manually
    world.update();
    await jest.runAllTimers();

    // There should now be more proper meshes in the camera view (4x4)
    var meshes = world.scene.children.filter(d => d.type == "Mesh");
    expect(meshes.filter(landFilter).length).toBe(16);
    expect(meshes.filter(emptyFilter).length).toBe(65);

    // Finally trigger a window resize to half the size, and test the resize handler
    world.setSize(640, 480);
    expect(world.camera.aspect).toEqual(4/3);
});
