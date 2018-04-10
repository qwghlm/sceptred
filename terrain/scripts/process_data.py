#!/usr/bin/env python3
"""
One-off script to build database files
Written in Python as support for projection conversion & shape contains is much better

Thanks to parallel processing & some divide-and-conquer, this
takes about 5 minutes to process the entire UK
(2858 squares, at 10 squares/sec)
"""
#pylint:disable=invalid-name,too-few-public-methods
import concurrent.futures
from datetime import datetime
from functools import partial
import math
import os
import os.path
import sys
import zipfile

from shapely.geometry import shape, Point, box
from shapely.ops import transform
from shapely.prepared import prep

import fiona
import numpy as np
from pymongo import MongoClient
import pyproj

from lib import parse_grid_reference, get_neighbor

def main(name_filter="nt27"):
    """
    Main runner
    """
    source_directory = "../asc/"

    # Check to see if data exists first
    if not os.path.exists(source_directory):
        print("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        sys.exit(1)

    # Walk through the data directory
    load_data(source_directory, name_filter)


class UKOutline:
    """Singleton for UK outline"""
    class __UKOutline:
        """Secret hidden class"""

        def __init__(self):
            shapefile = "../shp/GBR_adm0.shp"
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
    """Singleton for UK outline"""
    class __DB:
        """Secret hidden class"""

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

def load_data(pathname, name_filter=""):
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
                grid_square, count, elapsed, float(count)/max(1, elapsed.seconds)))

        print("\n{} squares done!".format(count))


def convert_to_db(input_path):
    """
    Converts tiles in the input path into the database
    """
    # Get grid reference, check on filter
    grid_reference = os.path.basename(input_path).split('_')[0]

    # Get raw squares
    heights = get_heights(input_path)

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
    if not os.path.exists(filepath):
        return None

    zipped = zipfile.ZipFile(filepath)
    asc_filename = [f for f in zipped.namelist() if f[-4:] == '.asc'][0]
    floats = np.genfromtxt(zipped.open(asc_filename), skip_header=5)
    return np.rint(floats).astype(int)


def make_path(grid_reference):
    """
    Gets path for zipfile for this gridref
    """
    return "../asc/{}/{}_OST50GRID_20170713.zip".format(
        grid_reference[:2],
        grid_reference,
    )


def get_heights(input_path):
    """
    Gets heights from a zipped asc file
    """
    grid = parse_zipped_asc(input_path)

    grid_reference = os.path.basename(input_path).split('_')[0]
    (width, _) = grid.shape

    # Get tile to the right; if it exists, add its left-most column
    # as our right-most. Else, duplicate values of right-most column
    right_file = make_path(get_neighbor(grid_reference, 1, 0))
    right = parse_zipped_asc(right_file)
    if right is not None:
        grid = np.insert(grid, width, right[:, 0], axis=1)
    else:
        grid = np.insert(grid, width, grid[:, -1], axis=1)

    # Get the tile to the top; if it exists, add its bottom-most row
    # as our top-most. Else duplicate values of top-most row
    top_file = make_path(get_neighbor(grid_reference, 0, 1))
    top = parse_zipped_asc(top_file)
    if top is not None:
        grid = np.insert(grid, 0, np.append(top[-1], top[-1][-1]), axis=0)
    else:
        grid = np.insert(grid, 0, grid[0], axis=0)

    # Get the tile to the top right; if it exists, set our top-right value
    # to its bottom-left. Else, it's already been set as a duplicate
    top_right_file = make_path(get_neighbor(grid_reference, 1, 1))
    top_right = parse_zipped_asc(top_right_file)
    if top_right is not None:
        grid[0][-1] = top_right[-1][0]

    return grid

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

if __name__ == "__main__":
    main()
