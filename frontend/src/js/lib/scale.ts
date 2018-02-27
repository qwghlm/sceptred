// Simple function that returns a linear scale
export function linearScale(fromOrigin: number, toOrigin: number, scaleFactor: number) {
    function scale(n: number) {
        return toOrigin + (n - fromOrigin) * scaleFactor;
    }
    return scale;
}
