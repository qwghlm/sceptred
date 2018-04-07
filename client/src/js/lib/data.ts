// Functions for parsing data from the API
import * as THREE from 'three';
import * as chroma from 'chroma-js';
import { gridrefToCoords, getGridSquareSize } from './grid';
import { GridData } from './types';

// Colors for each altitude
const colorRange = ['#3D7F28', '#155B11', '#C5BB52', '#B37528', '#999999', '#CCCCCC'];
const colorDomain = [0, 200, 400, 600, 800, 1000, 1400];

// Parses the grid data and transforms from Ordnance Survey into world co-ordinates
//
// This is relatively costly:
//
// Preparing grid data: ~1ms
// Building vertices: 25-50ms
// Building faces: 5-10ms
// Converting to buffers: 2-6ms
// Building geometries: 5-25ms
// Total time: 40-90ms
export function makeLandGeometry(data: GridData, transform: THREE.Matrix4) {

    const tileOrigin = gridrefToCoords(data.meta.gridReference);
    const squareSize = data.meta.squareSize;

    // Grid data starts in north-west while Ordnance Survey origin is in south-west
    // so we reverse the rows first
    var grid = data.heights.reverse();
    var land = data.land.reverse();

    // Extend the grid by 1 = we have 200x200 squares, so need 201x201 points to define them
    // Naively at first, we just clone the values in the 200th row & column for 201st.
    // This will cause discontinuities on mountainous terrain, so we later modify the grid if & when
    // we find neighbouring tiles to the north and east
    function extendByOne(d) {
        d.forEach((row) => row.push(row[row.length - 1]));
        d[d.length] = d[d.length - 1];
    }
    extendByOne(grid);
    extendByOne(land);

    var gridHeight = grid.length;
    var gridWidth = grid[0].length;

    // Calculate vertices and colors
    var vertices = new Float32Array(3*gridHeight*gridWidth);
    var colors = new Uint8Array(3*gridHeight*gridWidth);

    // Our colour scale maker for land
    var colorFunction = chroma.scale(colorRange)
        .domain(colorDomain)
        .mode('lab');

    const seaColor = chroma.num(0x082044).rgb();

    // Go through each row and then each column of the grid
    grid.forEach((row, y) => row.forEach((z, x) => {

        // Work out index of this point in the vertices array
        var i = x + gridWidth*y;
        var isLand = z > 0 || land[y][x];

        // Assign vertices
        // BufferGeometry stores each x, y, z value separately so we multiply by 3
        // to get the position inside the
        vertices[i*3] = tileOrigin.x + x*squareSize;
        vertices[i*3+1] = tileOrigin.y + y*squareSize;
        vertices[i*3+2] = isLand ? z : 0;

        // Assign colors
        // Same for r, g, b
        const color = isLand ? colorFunction(z).rgb() : seaColor;
        colors[i*3] = color[0];
        colors[i*3+1] = color[1];
        colors[i*3+2] = color[2];

    }));

    // Calculate the faces - two triangles which form between them a square
    var faces: number[] = [];
    grid.forEach((row, y) => row.forEach((z, x) => {

        // Points that are in the right-most or bottom-most row/column cannot form top-left of a square
        if (x == gridWidth - 1 || y == gridHeight - 1) {
            return;
        }

        // Get indexes of the points for the square for which this point is the top-left
        var i = x + gridWidth*y;
        var a = i, b = i+1, c = i+gridWidth, d = i+gridWidth+1;

        // Assign faces (clockwise)
        // a--b
        // |//|
        // c--d
        faces.push(a, b, c);
        faces.push(b, d, c);

    }));

    // Build our buffers
    var verticesBuffer = transform.applyToBufferAttribute(new THREE.BufferAttribute(vertices, 3));
    var colorsBuffer = new THREE.BufferAttribute(colors, 3, true);

    // And create a geometry from them
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', verticesBuffer);
    geometry.addAttribute('color', colorsBuffer);
    geometry.setIndex(faces);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    return geometry;

}

// Returns an empty square, useful for either the grid or an element of sea
export function makeEmptyGeometry(gridSquare:string, transform: THREE.Matrix4, scale: THREE.Vector3) {

    let square = getGridSquareSize(gridSquare).applyMatrix4((new THREE.Matrix4()).scale(scale));

    // Calculate position of square
    // The half-square addition at the end is to take into account PlaneGeometry
    // is created around the centre of the square and we want it to be bottom-left

    let coords = gridrefToCoords(gridSquare).applyMatrix4(transform);
    let geometry = new THREE.PlaneGeometry(square.x, square.y);
    geometry.translate(coords.x + square.x/2, coords.y + square.y/2, coords.z);
    geometry.computeBoundingBox();
    return geometry;

}

// Updates a target land geometry's Z and color values along an edge to that of its neighbor,
// with the relation being defined by the relation attribute
//
// Stitches take about 6-10ms
export function stitchGeometries(target: THREE.BufferGeometry, neighbor: THREE.BufferGeometry, relation: string) {

    // Get the BufferAttribute positions of both
    var targetPositions = target.getAttribute('position') as THREE.BufferAttribute;
    var neighbourPositions = neighbor.getAttribute('position');

    var targetColors = target.getAttribute('color') as THREE.BufferAttribute;
    var neighbourColors = neighbor.getAttribute('color');

    // Work out the height and width of the geometries (201 x 201)
    var targetHeight = Math.sqrt(targetPositions.count);
    var targetWidth = targetHeight;

    // If the neighbor is to the top, then its bottom row [0] should be copied to the
    // target's top [200]
    if (relation == "top") {
        for (var i=0; i<targetWidth - 1; i++) {
            var neighborIndex = i;
            var targetIndex = targetWidth*(targetHeight-1) + i;
            targetPositions.setZ(targetIndex, neighbourPositions.getZ(neighborIndex))

            targetColors.setX(targetIndex, neighbourColors.getX(neighborIndex))
            targetColors.setY(targetIndex, neighbourColors.getY(neighborIndex))
            targetColors.setZ(targetIndex, neighbourColors.getZ(neighborIndex))
        }
    }

    // If the neighbor is to the right, then the first element of every row should
    // be copied to the last element of the corresponding row on the target
    else if (relation == "right") {
        for (var i=0; i<targetHeight - 1; i++) {
            var neighborIndex = i*targetWidth;
            var targetIndex = (i+1)*targetWidth - 1;
            targetPositions.setZ(targetIndex, neighbourPositions.getZ(neighborIndex))
            targetColors.setX(targetIndex, neighbourColors.getX(neighborIndex))
            targetColors.setY(targetIndex, neighbourColors.getY(neighborIndex))
            targetColors.setZ(targetIndex, neighbourColors.getZ(neighborIndex))
        }
    }

    // If the neighbor is to the top right, then the bottom left element should
    // be copied to the top right of the target
    else if (relation == "topRight") {
        var neighborIndex = 0;
        var targetIndex = targetHeight*targetWidth - 1;
        targetPositions.setZ(targetIndex, neighbourPositions.getZ(neighborIndex))
        targetColors.setX(targetIndex, neighbourColors.getX(neighborIndex))
        targetColors.setY(targetIndex, neighbourColors.getY(neighborIndex))
        targetColors.setZ(targetIndex, neighbourColors.getZ(neighborIndex))
    }

    // All done! Update the target with the new positions array
    targetPositions.needsUpdate = true;
    target.addAttribute('position', targetPositions);

    targetColors.needsUpdate = true;
    target.addAttribute('color', targetColors);

    // And recalculate the normal vectors to smooth the shading
    target.computeVertexNormals();
    return target;

}
