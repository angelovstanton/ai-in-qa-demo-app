# ?? Quick Start Guide

## **1-Minute Setup**

### **Docker (Recommended)**
```bash
git clone https://github.com/angelovstanton/ai-in-qa-demo-app.git
cd ai-in-qa-demo-app/city-services-portal
./start-docker.bat    # Windows
make start            # Mac/Linux
```

### **Local Development**
```bash
# Terminal 1 - API
cd city-services-portal/api
npm install && npm run db:generate && npm run db:push && npm run db:seed && npm run dev

# Terminal 2 - UI  
cd city-services-portal/ui
npm install && npm run dev
```

## **Access Points**
- **?? Main App**: http://localhost:5173
- **?? API Docs**: http://localhost:3001/api-docs
- **?? Health Check**: http://localhost:3001/health

## **Demo Accounts**
| Role | Email | Password |
|------|-------|----------|
| ?? Citizen | john@example.com | password123 |
| ????? Clerk | mary.clerk@city.gov | password123 |
| ?? Admin | admin@city.gov | password123 |

## **Key Features for Testing**
- ? **100+ Test Selectors** (`data-testid` attributes)
- ? **Multi-step Forms** with validation
- ? **Role-based Workflows** 
- ? **Feature Flags** for bug simulation
- ? **Real-time Search** and filtering
- ? **File Uploads** and attachments
- ? **Status Management** state machine

**?? Perfect for AI-powered QA testing demonstrations!**