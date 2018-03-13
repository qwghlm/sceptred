#!/usr/bin/env bash

# Installs the terrain DB files, which are too big for Github and too expensive to download for Git LFS

# Move into the terrain DB
cd server/terrain/db/

for FILENAME in "MANIFEST" "000000.vlog" "000001.sst"
do
    if [ ! -f ./$FILENAME ]; then
        echo "Downloading $FILENAME..."
        curl "https://sceptred-qwghlm.s3-eu-west-1.amazonaws.com/db/$FILENAME" -o $FILENAME --progress-bar
        # TODO Validate hash?
    fi
done

printf "\e[1;32mDone!\e[0m\n"
