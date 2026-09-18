#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  IBTIKAR BMS - Office Network Deploy"
echo "============================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo "Install Node 18+ then run again."
  exit 1
fi

echo "[1/3] Installing dependencies..."
npm install

echo
echo "[2/3] Building production app..."
npm run build

echo
echo "[3/3] Starting network server on port 5000..."
echo
echo "--------------------------------------------"
echo "  On THIS PC open:   http://localhost:5000"
echo
echo "  On OTHER PCs open: http://YOUR-PC-IP:5000"
echo "  Example:           http://192.168.1.20:5000"
echo
echo "  Login: admin@ibtikar.com"
echo "  Password: any"
echo
echo "  Keep this terminal OPEN while people use the app."
echo "  Press Ctrl+C to stop the server."
echo "--------------------------------------------"
echo
echo "Your network IP address(es):"
if command -v hostname >/dev/null 2>&1; then
  hostname -I 2>/dev/null || ip addr 2>/dev/null | grep -o 'inet [0-9.]*' || true
fi
echo

npx --yes serve dist -l 5000
