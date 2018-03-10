import { BaseMap } from '../lib/map.base';

const origin = [3e05, 6e05];
const gridref = 'SV';
//
jest.mock('../lib/loader', () => {
    class Loader{
        isLoading() { return false; }
        load() {
            return new Promise(
                (resolve, reject) => reject ? resolve() : resolve()
            )
        }
    };
    return {Loader}
});

test('BaseMap works', async () => {

    document.body.innerHTML = "<div id='test'></div>";
    var view = await new BaseMap(
        document.getElementById('test'),
        {
            origin : origin,
            heightFactor: 1,
            debug : false,
        }
    );

    // TODO Set width

    // Check map is loaded
    expect(view.loaded).toBe(true);

    // There should be 25 meshes (a 5x5 grid)
    var meshes = view.scene.children.filter(d => d.type == "Mesh");
    // expect(meshes.length).toBe(25);

    // TODO There should be one "proper" mesh in there

    // TODO Trigger a camera change and await loads

    // TODO There should now be more proper meshes in the camera view

    // TODO Perform a window resize and check things have been resized properly

});
