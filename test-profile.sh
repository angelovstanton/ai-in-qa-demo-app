#!/bin/bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "Testing John's profile data..."
echo "================================"

# Get profile
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/auth/me | python -m json.tool