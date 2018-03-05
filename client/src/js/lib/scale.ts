// Simple function that returns a linear scale
function linearScale(fromOrigin: number, toOrigin: number, scaleFactor: number) {
    function scale(n: number) {
        return toOrigin + (n - fromOrigin) * scaleFactor;
    }
    return scale;
}

export function makeScale(xOrigin: number, yOrigin: number, heightFactor: number) {

    const metresPerPixel = 50;
    var xScale = linearScale(xOrigin, 0, 1/metresPerPixel);
    var yScale = linearScale(yOrigin, 0, 1/metresPerPixel);
    var zScale = linearScale(0, 0, heightFactor/metresPerPixel);

    return (x: number, y: number, z: number) => {
        return [xScale(x), yScale(y), zScale(z)];
    };

}
