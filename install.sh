#!/usr/bin/env bash

# Installs the terrain DB files, which are too big for Github and too expensive to download for Git LFS

# Move into the terrain DB
cd server/terrain/db/

# Set the path
AWS_PATH="https://sceptred-qwghlm.s3-eu-west-1.amazonaws.com/db/"

# If path is set to -t, use the test options
while getopts ":t" opt; do
  case $opt in
    t)
      echo "Using the test database..."
      AWS_PATH="https://sceptred-qwghlm.s3-eu-west-1.amazonaws.com/db/test/"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done

for FILENAME in "MANIFEST" "000000.vlog" "000001.sst"
do
    if [ ! -f ./$FILENAME ]; then
        echo "$FILENAME not found, downloading..."
        curl "$AWS_PATH$FILENAME" -o $FILENAME --progress-bar
        # TODO Validate hash?
    fi
done

printf "\e[1;32mDone!\e[0m\n"
