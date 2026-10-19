#!/usr/bin/env bash
# City Services Portal - Docker control script
# Usage: ./docker-app.sh [start|reset|reseed|restart|stop|logs [service]|status|clean|help]

set -e

cd "$(dirname "$0")"

COMMAND="${1:-start}"

print_header() {
  echo "====================================="
  echo " City Services Portal (Docker)"
  echo "====================================="
  echo
}

check_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "[ERROR] Docker is not installed. Get it from https://docs.docker.com/get-docker/"
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Start Docker Desktop (or the Docker daemon) and try again."
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo "[ERROR] Docker Compose v2 is required ('docker compose')."
    exit 1
  fi
}

wait_for_app() {
  echo "Waiting for the API (a fresh database is seeded first - this can take 1-3 minutes)..."
  for i in $(seq 1 150); do
    status="$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q api)" 2>/dev/null || true)"
    if [ "$status" = "healthy" ]; then
      echo
      echo "[OK] API is healthy"
      return 0
    fi
    if [ $((i % 5)) -eq 0 ]; then
      printf "  ...still starting (%ss elapsed)" "$((i * 2))"
    fi
    sleep 2
  done
  echo
  echo "[ERROR] API did not become healthy in time. Check logs with: ./docker-app.sh logs api"
  exit 1
}

print_info() {
  echo
  echo "====================================="
  echo " Application is running!"
  echo "====================================="
  echo " Frontend: http://localhost:5173"
  echo " API:      http://localhost:3001"
  echo " API Docs: http://localhost:3001/api-docs"
  echo
  echo " Demo accounts (password: password123):"
  echo "   Citizen:     john@example.com"
  echo "   Clerk:       mary.clerk@city.gov"
  echo "   Supervisor:  supervisor1@city.gov"
  echo "   Field Agent: agent1@city.gov"
  echo "   Admin:       admin@city.gov"
  echo
  echo " Manage: ./docker-app.sh [restart|reset|reseed|stop|logs|status|clean]"
  echo "====================================="
}

usage() {
  cat <<EOF
Usage: ./docker-app.sh [command]

Commands:
  start     Build images and start the app (default). Seeds data on first run.
  reset     Remove containers and data volume, rebuild and start with fresh seed data.
  reseed    Wipe and reseed the database only (no rebuild).
  restart   Restart the running containers (data is kept).
  stop      Stop the containers (data is kept).
  logs      Follow logs. Optionally pass a service: logs api | logs ui
  status    Show container status.
  clean     Remove containers, data volume and built images.
  help      Show this help.
EOF
}

case "$COMMAND" in
  start)
    print_header
    check_docker
    docker compose up -d --build
    wait_for_app
    print_info
    ;;
  reset)
    print_header
    check_docker
    echo "Resetting: removing containers and database volume..."
    docker compose down -v
    docker compose up -d --build
    wait_for_app
    print_info
    ;;
  reseed)
    print_header
    check_docker
    echo "Reseeding database..."
    docker compose stop api
    docker compose run --rm --no-deps -e FORCE_SEED=true api true
    docker compose up -d
    wait_for_app
    print_info
    ;;
  restart)
    print_header
    check_docker
    docker compose restart
    wait_for_app
    print_info
    ;;
  stop)
    check_docker
    docker compose stop
    ;;
  logs)
    check_docker
    shift || true
    docker compose logs -f "$@"
    ;;
  status)
    check_docker
    docker compose ps
    ;;
  clean)
    check_docker
    docker compose down -v --rmi local --remove-orphans
    echo "[OK] Containers, data volume and images removed."
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "[ERROR] Unknown command: $COMMAND"
    echo
    usage
    exit 1
    ;;
esac
