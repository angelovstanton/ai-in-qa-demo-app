#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "====================================="
echo "AI in QA Demo App - Installation Script"
echo "====================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}[✓] Node.js found:${NC}"
node --version
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] npm found:${NC}"
npm --version
echo

# Check if we're in the right directory
if [ ! -d "city-services-portal" ]; then
    echo -e "${RED}[ERROR] Cannot find city-services-portal directory${NC}"
    echo "Please run this script from the root of the ai-in-qa-demo-app repository"
    exit 1
fi

# Navigate to API directory
echo "====================================="
echo "Setting up Backend API..."
echo "====================================="
cd city-services-portal/api || {
    echo -e "${RED}[ERROR] Cannot navigate to city-services-portal/api directory${NC}"
    exit 1
}

# Install API dependencies
echo "Installing API dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to install API dependencies${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating environment file..."
    cp .env.example .env
    echo -e "${GREEN}[✓] Environment file created${NC}"
else
    echo -e "${GREEN}[✓] Environment file already exists${NC}"
fi

# Setup database
echo "Setting up database..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to generate Prisma client${NC}"
    exit 1
fi

npm run db:push
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to create database schema${NC}"
    exit 1
fi

npm run db:seed
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to seed database${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] Database setup complete${NC}"
echo

# Navigate to UI directory
echo "====================================="
echo "Setting up Frontend UI..."
echo "====================================="
cd ../ui || exit

# Install UI dependencies
echo "Installing UI dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to install UI dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] UI setup complete${NC}"
echo

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

# Start both servers
echo "====================================="
echo "Starting Application..."
echo "====================================="
echo
echo "Starting API server on http://localhost:3001"
echo "Starting UI server on http://localhost:5173"
echo

# Start API server in background
cd ../api
npm run dev &
API_PID=$!
echo "API Server PID: $API_PID"

# Wait a bit for API to start
sleep 5

# Start UI server in background
cd ../ui
npm run dev &
UI_PID=$!
echo "UI Server PID: $UI_PID"

# Wait for UI to start
sleep 5

# Try to open browser (works on Mac and most Linux distros)
echo "Opening application in browser..."
if command -v open &> /dev/null; then
    # macOS
    open "http://localhost:5173"
    sleep 2
    open "http://localhost:3001/api-docs"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:5173"
    sleep 2
    xdg-open "http://localhost:3001/api-docs"
fi

echo
echo "====================================="
echo -e "${GREEN}Application Started Successfully!${NC}"
echo "====================================="
echo
echo -e "${GREEN}[OPENED IN BROWSER]${NC}"
echo -e "${YELLOW}Frontend:${NC} http://localhost:5173"
echo -e "${YELLOW}Swagger API Docs:${NC} http://localhost:3001/api-docs"
echo
echo -e "${GREEN}[RUNNING SERVERS]${NC}"
echo "- API Server: Port 3001 (PID: $API_PID)"
echo "- UI Server: Port 5173 (PID: $UI_PID)"
echo
echo "Demo Accounts (password: password123):"
echo "- Citizen: john@example.com"
echo "- Admin: admin@city.gov"
echo "- Clerk: mary.clerk@city.gov"
echo "- Supervisor: supervisor1@city.gov"
echo "- Field Agent: agent1@city.gov"
echo
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo

# Wait for servers to keep running
wait