#!/usr/bin/env python3
"""
One-off script to build database files
Written in Python as support for projection conversion & shape contains is much better

TODO Parallelize? https://medium.com/@ageitgey/quick-tip-speed-up-your-python-data-processing-scripts-with-process-pools-cf275350163a
"""
from datetime import datetime
from functools import partial
import json
import math
import os
import os.path
import re
import sys
import zipfile

from shapely.geometry import shape, Point, box
from shapely.ops import transform
from shapely.prepared import prep

import fiona
import numpy as np
import pyproj

def main():
    """
    Main runner
    """
    source_directory = "../terrain/raw/asc/"
    shapefile = "../terrain/raw/shp/GBR_adm0.shp"

    # Check to see if data exists first
    if not os.path.exists(source_directory):
        print("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        sys.exit(1)

    # Walk through the data directory
    load_data(source_directory, shapefile, "nt")


def load_data(pathname, shapefile, name_filter=""):
    """
    Loads data from terrain directory
    """
    output_directory = "../terrain/db/"
    count = 0

    # Create geometry of UK
    uk_outline_file = fiona.open(shapefile)[0]
    uk_outline_wgs84 = shape(uk_outline_file['geometry'])

    # Transform into Ordnance Survey co-ordinates
    project = partial(
        pyproj.transform,
        pyproj.Proj(init='epsg:4326'),
        pyproj.Proj(init='epsg:27700'))

    uk_outline = prep(transform(project, uk_outline_wgs84))

    start = datetime.now()
    for directory in os.listdir(pathname):
        if not os.path.isdir(pathname + directory):
            continue

        directory_path = pathname + directory
        for file in os.listdir(directory_path):
            if file[-4:] != '.zip':
                continue

            # Get grid reference, check on filter
            grid_reference = file.split('_')[0]
            if name_filter and grid_reference[:len(name_filter)] != name_filter:
                continue

            # Get raw squares
            squares = parse_zipped_asc(os.path.join(directory_path, file))

            # Determing what is land and what is sea
            (left, bottom) = parse_grid_reference(grid_reference)
            coords = (left, bottom + 10000)
            land = determine_land(squares, coords, uk_outline)

            json_data = {
                "meta": {
                    "squareSize":50,
                    "gridReference":grid_reference.upper()
                },
                "data": squares.tolist(), # TODO
                "land": land.tolist(),
            }

            # Write out to JSON file
            with open("{}{}.json".format(output_directory, grid_reference), 'w') as output_file:
                json.dump(json_data, output_file, separators=(',', ':'))

            count += 1
            elapsed = datetime.now() - start
            print("So far we have taken {}, that's {:.1f} squares per second".format(
                elapsed, float(count)/max(1, elapsed.seconds)), end="\r")

    print("\n{} squares done!".format(count))


def parse_zipped_asc(filepath):
    """
    Opens a ZIP file and extracts the ASC, and parses it
    """
    zipped = zipfile.ZipFile(filepath)
    asc_filename = [f for f in zipped.namelist() if f[-4:] == '.asc'][0]
    floats = np.genfromtxt(zipped.open(asc_filename), skip_header=5)
    return np.rint(floats).astype(int)


def determine_land(squares, nw_corner, outline):
    """
    Work out if squares located with their bottom left at this grid reference
    are land or sea
    Return NxN array of 0/1 values (0=sea, 1=land)
    """
    (rows, cols) = squares.shape

    # If entirely under sea level, this square is empty
    if np.amax(squares) < 0:
        return np.zeros((rows, cols), dtype=int)

    # If entirely above sea level, skip
    if np.min(squares) > 0:
        return np.ones((rows, cols), dtype=int)

    # Work out outline of this square
    (left, top) = nw_corner
    size = 50
    square = box(left, top - size*rows, left + size*cols, top)

    # If square is fully contained by the country, then it is all land
    if outline.contains(square):
        return np.ones((rows, cols), dtype=int)

    # Attempt a divide & conquer if bigger than 4x4
    if rows > 4 and cols > 4:

        x_split = math.floor(cols/2)
        y_split = math.floor(rows/2)

        land_fragments = [
            [
                determine_land(squares[:y_split, :x_split], (left, top), outline),
                determine_land(squares[:y_split, x_split:], (left + x_split*size, top), outline),
            ],
            [
                determine_land(squares[y_split:, :x_split], (left, top - y_split*size), outline),
                determine_land(squares[y_split:, x_split:], (left + x_split*size, top - y_split*size), outline),
            ],
        ]
        return np.concatenate(
            [np.concatenate(row, 1) for row in land_fragments]
        )

    # Work out where where each 50m square intersects with the land
    land = np.empty((rows, cols), dtype=int)
    for y in range(0, rows):
        for x in range(0, cols):
            point = Point(left + size*(x + .5), top - size*(y + .5))
            land[y, x] = int(outline.contains(point))
    return land

def parse_grid_reference(grid_reference):
    """
    Parses a grid reference e.g.
    parse_grid_reference('TG 51409 13177') == (651409, 313177)
    """
    # Standardise input
    grid_reference = re.sub(r"\s+", "", grid_reference).upper()

    if not re.match(r"^[A-Z]{2}[0-9]+$", grid_reference):
        raise ValueError("Invalid grid reference")

    # get numeric values of letter references, mapping A->0, B->1, C->2, etc:
    l1 = ord(grid_reference[0]) - ord("A")
    l2 = ord(grid_reference[1]) - ord("A")

    # shuffle down letters after 'I' since 'I' is not used in grid:
    if l1 > 7:
        l1 -= 1
    if l2 > 7:
        l2 -= 1

    # convert grid letters into 100km-square indexes from false origin (grid square SV):
    e100km = ((l1-2)%5)*5 + (l2%5)
    n100km = (19-math.floor(l1/5)*5) - math.floor(l2/5)

    if e100km<0 or e100km>6 or n100km<0 or n100km>12:
        raise ValueError('Grid reference outside UK')

    # skip grid letters to get numeric (easting/northing) part of ref
    en = grid_reference[2:]
    if len(en) % 2 != 0:
        raise ValueError('Grid reference must have even number of digits')

    # slice into two
    half_length = int(len(en)/2)
    easting, northing = en[:half_length], en[half_length:]

    # standardise to 10-digit refs (metres)
    easting = e100km*100000 + int((easting+'00000')[:5])
    northing = n100km*100000 + int((northing+'00000')[:5])
    return (easting, northing)

if __name__ == "__main__":
    main()
