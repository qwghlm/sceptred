import * as chroma from 'chroma-js';

// For sea
export const seaColor = 0x082044;

// For land
const landColorRange = ['#3D7F28', '#155B11', '#C5BB52', '#B37528', '#999999', '#CCCCCC'];
const landColorDomain = [0, 200, 400, 600, 800, 1000, 1400];

// Sea is a constant
export const seaColorRGB = chroma.num(seaColor).rgb();

// Colour scale maker for land
export const landColor = chroma.scale(landColorRange)
    .domain(landColorDomain)
    .mode('lab');
