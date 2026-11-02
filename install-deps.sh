#!/bin/bash
# Install dependencies for HolaMotor on OrangePi

echo "=== Installing HolaMotor Dependencies ==="
echo ""

cd ~/holamotor-angular

echo "Running npm install..."
npm install

echo ""
echo "✓ Dependencies installed successfully"
echo ""
echo "Now run: ./setup-orange-pi.sh"
