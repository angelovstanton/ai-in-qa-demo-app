# ?? City Services Portal - Docker Quick Start

## ?? **ONE-COMMAND STARTUP**

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### ?? **Start Everything with One Command**

```bash
cd city-services-portal
docker-compose up --build
```

**That's it!** ??

## ?? **Access the Application**

After startup (2-3 minutes), access:

- **?? Main Application**: http://localhost:5173
- **?? API Documentation**: http://localhost:3001/api-docs  
- **?? Health Check**: http://localhost:3001/health

## ?? **Demo Accounts Ready to Use**

```
?? Citizen: john@example.com / password123
????? Clerk: mary.clerk@city.gov / password123  
????? Supervisor: supervisor@city.gov / password123
?? Field Agent: field.agent@city.gov / password123
?? Admin: admin@city.gov / password123
```

## ?? **Instant Testing Scenarios**

### ?? **Scenario 1: End-to-End Citizen Journey**
1. Visit http://localhost:5173
2. Login as `john@example.com` / `password123`
3. Click **"Create New Request"** 
4. Complete 4-step wizard ? Submit
5. View in **"My Requests"** DataGrid

### ?? **Scenario 2: Clerk Workflow**
1. Login as `mary.clerk@city.gov` / `password123`
2. Access **"Inbox"** ? Split-view interface
3. Filter requests ? Select ? View details
4. Test **"Triage"** and **"Start Work"** buttons

### ?? **Scenario 3: Admin Bug Simulation**
1. Login as `admin@city.gov` / `password123`
2. Navigate to **"Feature Flags"**
3. Toggle flags to simulate bugs:
   - `API_Random500` ? 5% API errors
   - `UI_WrongDefaultSort` ? Wrong sorting
   - `API_SlowRequests` ? Performance issues

### ?? **Scenario 4: API Testing**
1. Visit http://localhost:3001/api-docs
2. Test endpoints interactively
3. View real-time error responses
4. Test authentication flows

## ?? **Docker Commands**

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset database (stop, remove volumes, restart)
docker-compose down -v && docker-compose up --build
```

## ?? **Monitoring & Logs**

```bash
# Watch real-time logs
docker-compose logs -f city-services-portal

# Check health status
curl http://localhost:3001/health

# API status
curl http://localhost:3001/

# Check container status
docker-compose ps
```

## ??? **Database Persistence**

Database is automatically persisted in `./data/` directory:
- Fresh database created on first run
- Data persists between container restarts
- Reset with: `docker-compose down -v`

## ? **Development Mode**

For live development with hot reload:

```bash
# Terminal 1 - API with hot reload
cd city-services-portal/api
npm install && npm run dev

# Terminal 2 - UI with hot reload  
cd city-services-portal/ui
npm install && npm run dev
```

## ?? **QA Testing Ready**

The Docker setup includes:
- ? **Complete test data** seeded automatically
- ? **All 5 user roles** with demo accounts
- ? **Feature flags** for bug simulation
- ? **Stable test selectors** for automation
- ? **API documentation** for testing
- ? **Health checks** for monitoring
- ? **Correlation IDs** for debugging

## ?? **Troubleshooting**

### Port Conflicts
```bash
# Check what's using port 3001
lsof -i :3001

# Check what's using port 5173
lsof -i :5173

# Kill processes if needed
kill -9 <PID>
```

### Database Issues
```bash
# Reset everything
docker-compose down -v
docker-compose up --build
```

### Container Issues
```bash
# Rebuild from scratch
docker-compose down
docker system prune -f
docker-compose up --build
```

---

**?? Your complete City Services Portal is now running in Docker!**

**Perfect for QA testing, demos, and development!**