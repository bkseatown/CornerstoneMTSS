#!/bin/bash
cd "$(dirname "$0")"
npx http-server . -p 4174 -c-1 --gzip
