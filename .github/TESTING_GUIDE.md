# ?? Testing Guide

## **QA Testing Features**

### **??? Feature Flags (Bug Simulation)**
Access: Login as admin ? Feature Flags page

| Flag | Description | Effect |
|------|-------------|--------|
| `API_Random500` | Server errors | 5% random API failures |
| `UI_WrongDefaultSort` | UI bugs | Wrong default sorting |
| `API_SlowRequests` | Performance | 10% slow responses |
| `API_UploadIntermittentFail` | Upload errors | Random upload failures |

### **??? Test Selectors**

#### **Authentication**
```typescript
"cs-login-email"
"cs-login-password" 
"cs-login-submit"
"cs-registration-first-name"
"cs-registration-email"
```

#### **Request Management**
```typescript
"cs-requests-create-button"
"cs-citizen-requests-grid"
"cs-new-request-wizard"
"cs-new-request-title"
"cs-inbox-request-list"
"cs-inbox-triage-button"
```

#### **Admin Features**
```typescript
"cs-admin-flag-toggle-{flagName}"
"cs-admin-seed-database"
```

## **?? Workflow Testing**

### **Request State Machine**
```
SUBMITTED ? TRIAGED ? IN_PROGRESS ? RESOLVED ? CLOSED
              ?           ?           ?
           REJECTED  WAITING_ON_CITIZEN  ?
                          ?         REOPENED
                      IN_PROGRESS
```

### **Role-based Actions**
- **Citizen**: Submit, view, comment
- **Clerk**: Triage, process, update
- **Supervisor**: Assign, approve, manage
- **Field Agent**: Complete, resolve
- **Admin**: Configure, monitor, reset

## **?? Complex Form Testing**

### **Multi-step Wizard (5 steps)**
1. **Basic Information** - Title, description, category, priority
2. **Location** - Address, landmarks, access instructions  
3. **Contact & Services** - Communication preferences, affected services
4. **Additional Details** - Permits, comments, satisfaction rating
5. **Review** - Final confirmation and submission

### **Dynamic Fields**
- Add/remove additional contacts
- Conditional field visibility
- Real-time validation feedback
- Cross-field validation rules

### **File Uploads**
- Drag and drop support
- File type validation
- Size restrictions
- Progress indicators

## **?? Search & Filter Testing**

### **Search Capabilities**
- **Debounced search** (500ms delay)
- **Multi-field search** (title, description, ID)
- **Real-time results**
- **Highlighting matches**

### **Filter Options**
- Status (submitted, triaged, in progress, etc.)
- Priority (low, medium, high, urgent)
- Category (roads, lighting, waste, etc.)
- Date ranges
- Assigned user

## **?? Testing Scenarios**

### **Happy Path Testing**
1. **User Registration** ? **Login** ? **Submit Request** ? **Track Status**
2. **Clerk Login** ? **View Inbox** ? **Triage Request** ? **Start Work**
3. **Admin Login** ? **Toggle Feature Flags** ? **Monitor Effects**

### **Error Condition Testing**
1. **Form Validation** - Invalid inputs, missing required fields
2. **Network Errors** - API failures, timeout handling
3. **Permission Testing** - Role-based access violations
4. **File Upload Errors** - Invalid types, size limits

### **Performance Testing**
1. **Large Data Sets** - 1000+ requests with pagination
2. **Concurrent Users** - Multiple roles simultaneously
3. **File Uploads** - Large files, multiple attachments
4. **Search Performance** - Complex queries with filters

### **Accessibility Testing**
1. **Keyboard Navigation** - Tab order, focus management
2. **Screen Reader** - ARIA labels, semantic HTML
3. **Color Contrast** - WCAG compliance
4. **Responsive Design** - Mobile, tablet, desktop

## **?? Testing Data Management**

### **Database Reset**
```bash
# Docker
docker-compose down -v && docker-compose up --build

# Local
cd city-services-portal/api
npm run db:reset
```

### **Fresh Test Data**
```bash
# Seed with demo data
npm run db:seed

# Access admin panel
Login as admin@city.gov ? Admin ? Seed Database
```

### **Test Isolation**
- Each test should start with clean state
- Use unique test data identifiers
- Clean up after test completion
- Avoid dependencies between tests

## **?? Automation Examples**

### **Playwright Example**
```javascript
// Login test
await page.goto('http://localhost:5173');
await page.fill('[data-testid="cs-login-email"]', 'john@example.com');
await page.fill('[data-testid="cs-login-password"]', 'password123');
await page.click('[data-testid="cs-login-submit"]');
await expect(page).toHaveURL(/\/citizen\/requests/);
```

### **Cypress Example**
```javascript
// Request submission test
cy.visit('/');
cy.get('[data-testid="cs-login-email"]').type('john@example.com');
cy.get('[data-testid="cs-login-password"]').type('password123');
cy.get('[data-testid="cs-login-submit"]').click();
cy.get('[data-testid="cs-requests-create-button"]').click();
cy.get('[data-testid="cs-new-request-title"]').type('Test Request');
```

## **?? Monitoring & Debugging**

### **Application Logs**
```bash
# Docker logs
docker-compose logs -f

# Local development
# API logs in terminal
# Browser console for UI
```

### **Health Checks**
- **API Health**: http://localhost:3001/health
- **Database**: Check via Prisma Studio
- **Feature Flags**: Admin panel monitoring

### **Debug Tools**
- **API Documentation**: http://localhost:3001/api-docs
- **Database Browser**: `npm run db:studio`
- **Network Tab**: Browser dev tools
- **React DevTools**: Component inspection

**?? Ready for comprehensive QA testing!**