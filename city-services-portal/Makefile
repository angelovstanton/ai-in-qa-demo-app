# City Services Portal - Quick Commands

.PHONY: help start stop restart build logs clean test health reset dev

# Default target
help: ## Show this help message
	@echo "?? City Services Portal - Docker Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## ?? Start the application (builds if needed)
	@echo "?? Starting City Services Portal..."
	docker-compose up --build

start-bg: ## ?? Start in background
	@echo "?? Starting City Services Portal in background..."
	docker-compose up -d --build

stop: ## ??  Stop the application
	@echo "??  Stopping City Services Portal..."
	docker-compose down -v

restart: ## ?? Restart the application
	@echo "?? Restarting City Services Portal..."
	docker-compose down -v
	docker-compose up --build

build: ## ?? Build the containers
	@echo "?? Building containers..."
	docker-compose build

logs: ## ?? Show application logs
	@echo "?? Showing logs..."
	docker-compose logs -f

health: ## ??  Check application health
	@echo "??  Checking health..."
	@curl -f http://localhost:3001/health 2>/dev/null && echo "? API is healthy" || echo "? API is not responding"
	@curl -f http://localhost:5173 2>/dev/null && echo "? UI is healthy" || echo "? UI is not responding"

test: ## ?? Open test URLs
	@echo "?? Test URLs:"
	@echo "?? Main App: http://localhost:5173"
	@echo "?? API Docs: http://localhost:3001/api-docs"
	@echo "??  Health: http://localhost:3001/health"

reset: ## ???  Reset database and restart
	@echo "???  Resetting database..."
	docker-compose down -v
	docker-compose up --build

clean: ## ?? Clean up containers and volumes
	@echo "?? Cleaning up..."
	docker-compose down -v --remove-orphans
	docker system prune -f

dev: ## ????? Development mode instructions
	@echo "????? Development Mode:"
	@echo ""
	@echo "Terminal 1 - API:"
	@echo "  cd city-services-portal/api"
	@echo "  npm install && npm run dev"
	@echo ""
	@echo "Terminal 2 - UI:"
	@echo "  cd city-services-portal/ui" 
	@echo "  npm install && npm run dev"

demo: ## ?? Show demo accounts
	@echo "?? Demo Accounts:"
	@echo ""
	@echo "?? Citizen: john@example.com / password123"
	@echo "????? Clerk: mary.clerk@city.gov / password123"
	@echo "????? Supervisor: supervisor@city.gov / password123"
	@echo "?? Field Agent: field.agent@city.gov / password123"
	@echo "?? Admin: admin@city.gov / password123"

quick: ## ? Quick start with health check
	@echo "? Quick starting City Services Portal..."
	docker-compose up -d --build
	@echo "? Waiting for services to be ready..."
	@sleep 30
	@make health
	@make test

status: ## ?? Show container status
	@echo "?? Container Status:"
	docker-compose ps

windows: ## ?? Windows-specific commands
	@echo "?? Windows Users:"
	@echo "Use start-docker.bat to start"
	@echo "Use stop-docker.bat to stop"