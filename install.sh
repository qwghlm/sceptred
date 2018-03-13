#! /usr/bin/env bash

# Installs the terrain DB files, which are too big for Github and too expensive to download for Git LFS

# Move into the terrain DB
cd server/terrain/db/

for FILENAME in "000000.vlog" "000001.sst" "MANIFEST"
do
    if [ ! -f ./$FILENAME ]; then
        echo "Downloading $FILENAME"

        # TODO Validate hash?
    fi
done