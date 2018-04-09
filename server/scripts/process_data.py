#!/usr/bin/env python3
"""
One-off script to build database files
Written in Python as support for projection conversion & shape contains is much better

Thanks to parallel processing & some divide-and-conquer, this
takes about 5 minutes to process the entire UK
(2858 squares, at 10 squares/sec)
"""
import concurrent.futures
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
from pymongo import MongoClient
import pyproj

def main():
    """
    Main runner
    """
    source_directory = "../../terrain/asc/"

    # Check to see if data exists first
    if not os.path.exists(source_directory):
        print("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        sys.exit(1)

    # Walk through the data directory
    load_data(source_directory, "nt")


class UKOutline:
    class __UKOutline:

        def __init__(self):
            shapefile = "../../terrain/shp/GBR_adm0.shp"
            uk_outline_file = fiona.open(shapefile)[0]
            uk_outline_wgs84 = shape(uk_outline_file['geometry'])

            # Transform into Ordnance Survey co-ordinates
            project = partial(
                pyproj.transform,
                pyproj.Proj(init='epsg:4326'),
                pyproj.Proj(init='epsg:27700'))

            self.outline = prep(transform(project, uk_outline_wgs84))

    instance = None

    def __init__(self):
        if not UKOutline.instance:
            UKOutline.instance = UKOutline.__UKOutline()

    def __getattr__(self, name):
        return getattr(self.instance, name)


class DB:
    class __DB:

        def __init__(self, db_name='local', collection_name='sceptred'):
            client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=500)
            client.get_database('admin').command({'serverStatus': 1})
            self.collection = client[db_name][collection_name]

    instance = None

    def __init__(self):
        if not DB.instance:
            DB.instance = DB.__DB()

    def __getattr__(self, name):
        return getattr(self.instance, name)

def load_data(pathname, name_filter="", force=False):
    """
    Loads data from terrain directory
    """
    count = 0

    files_to_process = []
    for directory in os.listdir(pathname):

        directory_path = os.path.join(pathname, directory)
        if not os.path.isdir(directory_path):
            continue

        for file in os.listdir(directory_path):
            if file[-4:] != '.zip':
                continue
            if name_filter and file[:len(name_filter)] != name_filter:
                continue

            input_path = os.path.join(directory_path, file)
            files_to_process.append(input_path)

    start = datetime.now()
    with concurrent.futures.ProcessPoolExecutor(max_workers=2) as executor:
        for grid_square in executor.map(convert_to_db, files_to_process):
            count += 1
            elapsed = datetime.now() - start
            print("Latest: {}. So far we have done {} in {}, that's {:.1f} squares per second".format(
                grid_square, count, elapsed, float(count)/max(1, elapsed.seconds)), end="\r")

        print("\n{} squares done!".format(count))


def convert_to_db(input_path):

    # Get grid reference, check on filter
    grid_reference = os.path.basename(input_path).split('_')[0]

    # Get raw squares
    heights = parse_zipped_asc(input_path)

    # Determing what is land and what is sea
    (left, bottom) = parse_grid_reference(grid_reference)
    coords = (left, bottom + 10000)
    outline = UKOutline().outline
    land = determine_land(heights, coords, outline)

    # Don't bother if there is no land
    if np.max(land) == 0:
        return grid_reference

    # Flip heights and land upside down so they start from SW corner when returning
    document = {
        "_id": grid_reference.upper(),
        "meta": {
            "squareSize": 50,
            "gridReference": grid_reference.upper()
        },
        "heights": np.flipud(heights).tolist(),
        "land": np.flipud(land).tolist(),
    }

    # Upsert into database
    collection = DB().collection
    collection.update(
        {'_id':document['_id']},
        document,
        True)

    return grid_reference

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

    # If entirely above sea level, then it must all be land
    if np.min(squares) > 0:
        return np.ones((rows, cols), dtype=int)

    # Work out outline of this square
    (left, top) = nw_corner
    size = 50
    square = box(left, top - size*rows, left + size*cols, top)

    # If square is fully contained by the country, then it is all land
    if outline.contains(square):
        return np.ones((rows, cols), dtype=int)

    # If entirely under sea level and no intersection with land, this square is all sea
    if outline.disjoint(square) and np.max(squares) < 0:
        return np.zeros((rows, cols), dtype=int)

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
