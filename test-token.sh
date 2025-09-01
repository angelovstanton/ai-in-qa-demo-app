#!/bin/bash
# Get token from login
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser999@example.com","password":"TestPassword123!@#"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:50}..."

# Test /auth/me endpoint
echo "Testing /auth/me endpoint:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/auth/me | python -m json.tool