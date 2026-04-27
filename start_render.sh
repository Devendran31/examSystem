#!/bin/bash
# Render startup script for Spring Boot

echo "Building and starting Exam Portal Backend..."

cd backend

echo "Running Maven build..."
mvn clean package -DskipTests

echo "Finding JAR file..."
JAR_FILE=$(find target -name "*.jar" -type f | head -1)

if [ -z "$JAR_FILE" ]; then
    echo "ERROR: No JAR file found after build!"
    exit 1
fi

echo "Starting application with JAR: $JAR_FILE"

java -jar "$JAR_FILE" \
    --spring.profiles.active=prod \
    --server.port=${PORT}
