#!/bin/sh
grunt build && vulcanize --inline-css --inline-scripts --strip-comments src/build.html | crisper --html src/vulcanized.html --js src/vulcanized.js && grunt minify
