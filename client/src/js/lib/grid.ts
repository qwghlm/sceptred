// Grid conversion functions are based upon
// https://github.com/chrisveness/geodesy/blob/master/osgridref.js

// Converts a grid reference (e.g. TL27) to Easting/Northings [520000, 270000]
// Grid reference can have spaces, but no commas
export function gridrefToCoords(gridref: string) {

    gridref = gridref.replace(/ +/g, "");

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
export function coordsToGridref(eastings: number, northings: number, digits=10) {

    if (digits%2!==0 || digits < 0 || digits > 16) {
        throw new RangeError('Invalid precision ‘'+digits+'’');
    }

    // Get the 100km-grid indices
    var e100k = Math.floor(eastings/100000), n100k = Math.floor(northings/100000);

    if (e100k<0 || e100k>6 || n100k<0 || n100k>12) {
        throw new Error("Co-ordinates are not within UK National Grid")
    }

    // Translate those into numeric equivalents of the grid letters
    var number1 = (19-n100k) - (19-n100k)%5 + Math.floor((e100k+10)/5);
    var number2 = (19-n100k)*5%25 + e100k%5;
    var gridSquare = [numberToLetter(number1), numberToLetter(number2)].join('');

    // Strip 100km-grid indices from easting & northing, and reduce precision
    digits /= 2;
    eastings = Math.floor((eastings%100000)/Math.pow(10, 5-digits))
    northings = Math.floor((northings%100000)/Math.pow(10, 5-digits))

    // Pad eastings & northings with leading zeros (just in case, allow up to 16-digit (mm) refs)
    const eastingsString = eastings.toString().padStart(digits, '0');
    const northingsString = northings.toString().padStart(digits, '0');
    return `${gridSquare}${eastingsString}${northingsString}`;

}

// TODO Function for getting surrounding squares

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
function numberToLetter(n: number) {
    // Compensate for skipped 'I' and build grid letter-pairs
    if (n > 7) n++;
    return String.fromCharCode(n+65);
}
