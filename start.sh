#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "====================================="
echo "Starting AI in QA Demo App..."
echo "====================================="
echo

# Check if node_modules exist
if [ ! -d "city-services-portal/api/node_modules" ]; then
    echo -e "${RED}[WARNING] API dependencies not installed. Run ./install-and-run.sh first!${NC}"
    exit 1
fi

if [ ! -d "city-services-portal/ui/node_modules" ]; then
    echo -e "${RED}[WARNING] UI dependencies not installed. Run ./install-and-run.sh first!${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f "city-services-portal/api/.env" ]; then
    echo -e "${YELLOW}[WARNING] Environment file not found. Creating from template...${NC}"
    cd city-services-portal/api
    cp .env.example .env
    cd ../..
fi

# Function to cleanup on exit
cleanup() {
    echo
    echo "Shutting down servers..."
    kill $API_PID 2>/dev/null
    kill $UI_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

echo "Starting API server on http://localhost:3001"
echo "Starting UI server on http://localhost:5173"
echo

# Start API server in background
cd city-services-portal/api
npm run dev &
API_PID=$!

# Wait a bit for API to start
sleep 3

# Start UI server in background
cd ../ui
npm run dev &
UI_PID=$!

cd ../..

echo
echo "====================================="
echo -e "${GREEN}Application Started!${NC}"
echo "====================================="
echo
echo -e "${YELLOW}Frontend:${NC} http://localhost:5173"
echo -e "${YELLOW}API Docs:${NC} http://localhost:3001/api-docs"
echo
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo

# Wait for servers to keep running
wait