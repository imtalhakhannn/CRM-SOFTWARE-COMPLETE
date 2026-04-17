#!/usr/bin/env bash
# Runtime API-URL injection — allows the same Docker image to point at any backend
# without rebuilding. Replaces the build-time VITE_API_URL baked into the bundle.
#
# Usage in the container: -e API_URL=https://my-backend.koyeb.app/api/v1
set -e

if [ -n "$API_URL" ]; then
  echo "[entrypoint] rewriting API URL to $API_URL"
  # Find the bundled JS and rewrite the baked-in default
  find /usr/share/nginx/html/assets -type f -name "*.js" -exec \
    sed -i "s|http://localhost:8000/api/v1|$API_URL|g" {} \;
  find /usr/share/nginx/html/assets -type f -name "*.js" -exec \
    sed -i "s|\"/api/v1\"|\"$API_URL\"|g" {} \;
fi
