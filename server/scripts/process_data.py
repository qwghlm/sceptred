#!/usr/bin/env python3
#
# One-off script to build database files
# Written in Python as support for projection conversion & shape contains is much better

from datetime import datetime
import os
import os.path
import sys
import zipfile

import fiona
import numpy as np
from shapely.geometry import shape, Point
from shapely.prepared import prep

def main():
    """
    Main runner
    """
    start = datetime.now()

    source_directory = "../terrain/data/"

    # Check to see if data exists first
    if not os.path.exists(source_directory):
        print("Terrain data folder not found. Please follow the instructions in the README, install it, and then try again")
        sys.exit(1)

    # Walk through the data directory
    load_data(source_directory, "")

    elapsed = datetime.now() - start
    print("Walk took {}".format(elapsed))

def load_data(pathname, filter):

    output_directory = "../terrain/db/";
    n = 0
    # TODO Output stuff

    # Create prepared geometry
    uk_outline_file = fiona.open("../terrain/shapes/GBR_adm0.shp")[0]
    uk_outline = prep(shape(uk_outline_file['geometry']))

    for directory in os.listdir(pathname):
        if not os.path.isdir(pathname + directory):
            continue

        directory_path = pathname + directory
        for file in os.listdir(directory_path):
            if file[-4:] != '.zip':
                continue

            grid_reference = file.split('_')[0]
            print("Checking grid reference {}".format(grid_reference), end="\r")

            if filter and grid_reference != filter:
                # print("Skipping {}".format(grid_reference))
                continue

            # Get raw squares
            squares = parse_zipped_asc(os.path.join(directory_path, file))

            # Clip out anything under sea level
            squares = clip_square(squares, grid_reference, uk_outline)
            if squares is None:
                continue

            # TODO Output square data in some way (JSON for now?)
            n += 1

    print("{} squares processed".format(n))

def parse_zipped_asc(filepath):
    """
    Opens a ZIP file and extracts the ASC, and parses it
    """
    z = zipfile.ZipFile(filepath)
    asc_filename = [f for f in z.namelist() if f[-4:] == '.asc'][0]
    return np.genfromtxt(z.open(asc_filename), skip_header=5)

def clip_square(squares, grid_reference, outline):

    # If entirely above sea level, skip
    if np.amax(squares) < 0:
        # print ("{} has no land".format(grid_reference))
        return None

    # If entirely under sea level, completely delete
    if np.amin(squares) > 0:
        return squares

    # TODO Work out co-ordinate of this square
    # TODO Work out where every square, using intersects()
    return squares


if __name__ == "__main__":
    main()
