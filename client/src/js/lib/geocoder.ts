import { coordsToGridref } from './grid.ts';
import * as THREE from 'three';

var geocoder;

// Promise-based geocode function using Google Maps API
export function geocode(searchTerm: string) {

    if (typeof geocoder == 'undefined') {
        if (typeof google == 'undefined') {
            return Promise.reject("Google Maps not loaded");
        }
        geocoder = new google.maps.Geocoder();
    }

    // https://developers.google.com/maps/documentation/javascript/geocoding
    var params = {
        address: searchTerm,
        componentRestrictions: {
            country: 'GB'
        }
    };
    return new Promise((resolve, reject) => {
        geocoder.geocode(params, (results, status) => {
            if (status == google.maps.GeocoderStatus.OK) {
                resolve(results.map(parseResult));
            }
            else {
                reject(status);
            }
        })
    });

}

// Parses address and location from result
function parseResult(result) {

    var location = result.geometry.location;
    var gridReference = latLonToOsGrid(location.lat(), location.lng());
    var name = result.formatted_address;
    return { name, gridReference };

}

function toRadians(n) {
    return n * Math.PI / 180;
}

// based on
// https://github.com/chrisveness/geodesy/blob/master/osgridref.js

function latLonToOsGrid(latitude, longitude) {

    // TODO Convert WGS84 to OSGB36

    var φ = toRadians(latitude);
    var λ = toRadians(longitude);

    var a = 6377563.396, b = 6356256.909;              // Airy 1830 major & minor semi-axes
    var F0 = 0.9996012717;                             // NatGrid scale factor on central meridian
    var φ0 = toRadians(49), λ0 = toRadians(-2);       // NatGrid true origin is 49°N,2°W
    var N0 = -100000, E0 = 400000;                     // northing & easting of true origin, metres
    var e2 = 1 - (b*b)/(a*a);                          // eccentricity squared
    var n = (a-b)/(a+b), n2 = n*n, n3 = n*n*n;         // n, n², n³

    var cosφ = Math.cos(φ), sinφ = Math.sin(φ);
    var ν = a*F0/Math.sqrt(1-e2*sinφ*sinφ);            // nu = transverse radius of curvature
    var ρ = a*F0*(1-e2)/Math.pow(1-e2*sinφ*sinφ, 1.5); // rho = meridional radius of curvature
    var η2 = ν/ρ-1;                                    // eta = ?

    var Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (φ-φ0);
    var Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(φ-φ0) * Math.cos(φ+φ0);
    var Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(φ-φ0)) * Math.cos(2*(φ+φ0));
    var Md = (35/24)*n3 * Math.sin(3*(φ-φ0)) * Math.cos(3*(φ+φ0));
    var M = b * F0 * (Ma - Mb + Mc - Md);              // meridional arc

    var cos3φ = cosφ*cosφ*cosφ;
    var cos5φ = cos3φ*cosφ*cosφ;
    var tan2φ = Math.tan(φ)*Math.tan(φ);
    var tan4φ = tan2φ*tan2φ;

    var I = M + N0;
    var II = (ν/2)*sinφ*cosφ;
    var III = (ν/24)*sinφ*cos3φ*(5-tan2φ+9*η2);
    var IIIA = (ν/720)*sinφ*cos5φ*(61-58*tan2φ+tan4φ);
    var IV = ν*cosφ;
    var V = (ν/6)*cos3φ*(ν/ρ-tan2φ);
    var VI = (ν/120) * cos5φ * (5 - 18*tan2φ + tan4φ + 14*η2 - 58*tan2φ*η2);

    var Δλ = λ-λ0;
    var Δλ2 = Δλ*Δλ, Δλ3 = Δλ2*Δλ, Δλ4 = Δλ3*Δλ, Δλ5 = Δλ4*Δλ, Δλ6 = Δλ5*Δλ;

    var N = I + II*Δλ2 + III*Δλ4 + IIIA*Δλ6;
    var E = E0 + IV*Δλ + V*Δλ3 + VI*Δλ5;

    N = Number(N.toFixed(0));
    E = Number(E.toFixed(0));

    return coordsToGridref(new THREE.Vector3(E, N, 0));
};
