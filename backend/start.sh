#!/bin/bash
set -e

echo "=== Starting Heartbeat ==="

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A config worker -l info --concurrency=2 &
WORKER_PID=$!

# Start Celery beat in background
echo "Starting Celery beat..."
celery -A config beat -l info &
BEAT_PID=$!

echo "Worker PID: $WORKER_PID, Beat PID: $BEAT_PID"

# Handle graceful shutdown
cleanup() {
    echo "Shutting down..."
    kill $WORKER_PID $BEAT_PID 2>/dev/null
    wait $WORKER_PID $BEAT_PID 2>/dev/null
    echo "Shutdown complete"
}
trap cleanup SIGTERM SIGINT

# Start Gunicorn in foreground
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --log-file -