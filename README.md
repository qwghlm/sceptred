# Sceptred

_This royal throne of kings, this sceptred isle,_<br>
_This earth of majesty, this seat of Mars,_<br>
_This other Eden, demi-paradise,_<br>
_This fortress built by Nature for her self_<br>
&nbsp;&nbsp;— William Shakespeare, _Richard II_

_Sceptred_ is a project to model the island of Great Britain in 3D, using open-source data.

![GitHub package version](https://img.shields.io/github/package-json/v/qwghlm/sceptred.svg)
[![Build Status](https://travis-ci.org/qwghlm/sceptred.svg?branch=master)](https://travis-ci.org/qwghlm/sceptred)
[![codecov](https://codecov.io/gh/qwghlm/sceptred/branch/master/graph/badge.svg)](https://codecov.io/gh/qwghlm/sceptred)

## Overview

This is very much a work in progress at the moment, all code is subject to change.

## Developing

### Before you start

This assumes you have Go and Node install already - if not, install those first! To install Webpack and associated build & test functionality, run:

    $ npm install

You will also need the database files. These are not included in the repo - they too large for Github so they are currently hosted on Amazon S3. To download them, run

    $ ./install.sh

This only needs to be done once, before you first run.

### Dev server & watcher

To run the dev server, run:

    $ npm run serve

To actively develop on the TypeScript, i.e. run Webpack in watch mode, run:

    $ npm run watch

## Testing

Client-side testing is done with Jest, and can be run as:

    $ npm run test:js

Server-side testing is done with Go's `testing` package, and can be run as:

    $ npm run test:go

All tests can be run with:

    $ npm run test

## Deploying

TBD

## Copyright

The source code for this project is licensed under the MIT License.

Mapping data contains Ordnance Survey data © Crown copyright and database right 2017.
