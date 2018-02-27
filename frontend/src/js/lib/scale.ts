// Grid conversion functions are based upon
// https://github.com/chrisveness/geodesy/blob/master/osgridref.js

// Converts a grid reference (e.g. TL27) to Easting/Northings [520000, 270000]
// Grid reference must have no spaces or commas
export function gridrefToCoords(gridref: string) {

    // Validate format
    if (!gridref.match(/^[A-Z]{2}[0-9]*$/i) || gridref.length % 2 !== 0) {
        throw new Error('Invalid grid reference');
    }

    var letter1 = letterToNumber(gridref.substr(0, 1));
    var letter2 = letterToNumber(gridref.substr(1, 1));

    // Convert grid letters into 100km-square indexes from false origin (grid square SV):
    var e100km = ((letter1 - 2) % 5) * 5 + (letter2 % 5);
    var n100km = (19-Math.floor(letter1/5)*5) - Math.floor(letter2/5);
    if (e100km < 0 || e100km > 6 || n100km < 0 || n100km > 12) {
        throw new Error('Grid reference outside of UK');
    }

    // Get number pair out
    var numbers = gridref.slice(2);
    var eastingsNorthings = [ numbers.slice(0, numbers.length/2), numbers.slice(numbers.length/2) ];

    // Standardise to 10-digit refs (metres)
    eastingsNorthings[0] = e100km + eastingsNorthings[0].padEnd(5, '0');
    eastingsNorthings[1] = n100km + eastingsNorthings[1].padEnd(5, '0');

    return eastingsNorthings.map(s => parseInt(s));
}

// Converts an Easting/Northings [520000, 270000] to grid reference (e.g. TL27)
export function coordsToGridref(eastings: number, northings: number) {

}


// Utils

// Converts a letter to number as used in the National Grid (A-Z -> 1-25, I not included)
function letterToNumber(letter: string) {
    if (letter.toUpperCase() === 'I') {
        throw new Error("I is not used in the grid system");
    }
    var index = letter.toUpperCase().charCodeAt(0) - 65;

    // As I is not used, if greater than I, return one less
    return (index > 7) ? index - 1 : index;
}



// Simple function that returns a linear scale
function makeScale(fromOrigin: number, toOrigin: number, scaleFactor: number) {
    function scale(n: number) {
        return toOrigin + (n - fromOrigin) * scaleFactor;
    }
}
