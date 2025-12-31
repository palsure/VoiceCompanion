#!/bin/sh
# Startup script for nginx on Cloud Run

echo "=== Nginx Startup ==="

# Check BACKEND_URL
if [ -z "$BACKEND_URL" ]; then
    echo "ERROR: BACKEND_URL is not set!"
    exit 1
fi

# Extract BACKEND_HOST if not set
if [ -z "$BACKEND_HOST" ]; then
    BACKEND_HOST=$(echo "$BACKEND_URL" | sed 's|https\?://||' | sed 's|/.*||')
    export BACKEND_HOST
fi

echo "BACKEND_URL: $BACKEND_URL"
echo "BACKEND_HOST: $BACKEND_HOST"

# Substitute environment variables in nginx config
envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Generated config:"
grep -E '(set.*backend|proxy_set_header Host)' /etc/nginx/conf.d/default.conf

echo "Testing nginx config..."
nginx -t

echo "Starting nginx..."
exec nginx -g 'daemon off;'

