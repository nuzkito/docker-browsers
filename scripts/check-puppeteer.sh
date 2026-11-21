#!/bin/sh
set -eu

current=$(sed -n 's/^ARG PUPPETEER_VERSION=//p' "$(dirname "$0")/../Dockerfile")
major=${current%%.*}

echo "Current:     $current"
echo "Newest $major.x: $(npm view "puppeteer-core@^$major" version --json | jq -r '[.] | flatten | last')"
echo "Latest:      $(npm view puppeteer-core version)"
