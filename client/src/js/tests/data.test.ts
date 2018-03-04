import { parseGridSquare } from '../lib/data';

test('parseGridSquare() works properly', () => {

    // Parse a very simple square
    var geometry = parseGridSquare({
        meta: {
            gridReference: 'TL27'
            squareSize: 50,
        },
        data: [
            [-2.1, -2.1],
            [3, 3]
        ]
    }, (x, y, z) => [x, y, z]);

    // Assert the geometry has two faces and four vertices
    expect(geometry.faces.length).toBe(2);
    expect(geometry.vertices.length).toBe(4);

    // Check co-ordinates of each vertex
    expect(geometry.vertices[0]).toEqual({x:520000, y:270000, z:-2.1});
    expect(geometry.vertices[1]).toEqual({x:520050, y:270000, z:-2.1});
    expect(geometry.vertices[2]).toEqual({x:520000, y:270050, z:3});

    // Check faces matches
    expect(geometry.faces[0].a).toEqual(0);
    expect(geometry.faces[0].b).toEqual(1);
    expect(geometry.faces[0].c).toEqual(2);

    expect(geometry.faces[1].a).toEqual(1);
    expect(geometry.faces[1].b).toEqual(3);
    expect(geometry.faces[1].c).toEqual(2);

    // TODO Fix red squiggles

});
