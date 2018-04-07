#!/usr/bin/env python3
#
# One-off script to build database files
# Written in Python as support for projection conversion & shape contains is much better
#
# TODO Parallelize? https://medium.com/@ageitgey/quick-tip-speed-up-your-python-data-processing-scripts-with-process-pools-cf275350163a
#
from datetime import datetime
from functools import partial
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
    source_directory = "../terrain/data/"

    # Check to see if data exists first
    if not os.path.exists(source_directory):
        print("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        sys.exit(1)

    # Walk through the data directory
    load_data(source_directory, "nt2")

def load_data(pathname, filter):

    output_directory = "../terrain/db/"
    count = 0
    # TODO Output stuff

    # Create geometry of UK
    uk_outline_file = fiona.open("../terrain/shapes/GBR_adm0.shp")[0]
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

            grid_reference = file.split('_')[0]

            if filter and grid_reference[:len(filter)] != filter:
                continue

            # Get raw squares
            squares = parse_zipped_asc(os.path.join(directory_path, file))

            # Clip out anything under sea level

            land = determine_land(squares, parse_grid_reference(grid_reference), uk_outline)
            if land is None:
                continue

            # TODO re-parse data as ints
            # TODO Output data in some way (JSON? Maybe MessagePack for compactness?)

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
    return np.genfromtxt(z.open(asc_filename), skip_header=5)


def determine_land(squares, sw_corner, outline):
    """
    Work out if squares located with their bottom left at this grid reference
    are land or sea
    Return NxN array of 0/1 values (0=sea, 1=land)
    """
    (cols, rows) = squares.shape
    size = 50

    # If entirely under sea level, this square is empty
    if np.amax(squares) < 0:
        return np.zeros((cols, rows), dtype=int)

    # If entirely above sea level, skip
    if np.min(squares) > 0:
        return np.ones((cols, rows), dtype=int)

    # Work out outline of this square
    (left, bottom) = sw_corner
    square = make_box(left, bottom, size*cols, size*rows)

    # If square is fully contained by the country, then it is all land
    if outline.contains(square):
        return np.ones((cols, rows), dtype=int)

    # Work out where where each 50m square intersects with the land
    land = np.empty((rows, cols), dtype=int)
    for y in range(0, rows):
        for x in range(0, cols):
            square = make_box(left + size*x, bottom + size*(rows - y), size, size)
            land[y, x] = int(outline.intersects(square))
    return land


def make_box(left, bottom, width, height):
    return box(left, bottom, left + width, bottom + height)


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
