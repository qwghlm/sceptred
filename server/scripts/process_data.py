#!/usr/bin/env python3
#
# One-off script to build database files
# Written in Python as support for projection conversion & shape contains is much better

from datetime import datetime
import os
import os.path
import sys
import zipfile

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
    # TODO Outputty stuff

    for directory in os.listdir(pathname):
        if not os.path.isdir(pathname + directory):
            continue

        directory_path = pathname + directory
        for file in os.listdir(directory_path):
            if file[-4:] != '.zip':
                continue

            grid_square = file.split('_')[0]
            if filter and grid_square != filter:
                print("Skipping {}".format(grid_square))
                continue

            squares = parse_zipped_asc(os.path.join(directory_path, file))

            # TODO Filter squares based on location & whether inside coastline
            # TODO Output square data in some way (JSON for now?)

def parse_zipped_asc(filepath):
    """
    Opens a ZIP file and extracts the ASC, and parses it
    """
    z = zipfile.ZipFile(filepath)
    asc_filename = [f for f in z.namelist() if f[-4:] == '.asc'][0]
    asc_lines = z.open(asc_filename).readlines()[5:]
    return [[int(round(float(f))) for f in line.strip().split(b' ')] for line in asc_lines]


if __name__ == "__main__":
    main()
