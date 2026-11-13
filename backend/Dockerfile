# Step 1: Build the Spring Boot application using Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package the application skipping tests for fast deployment
RUN mvn clean package -DskipTests

# Step 2: Run the application in lightweight JRE container
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Render exposes the port via the PORT environment variable (defaults to 10000 on Render)
ENV PORT=10000
EXPOSE 10000

# Run the jar with explicit server.port override
CMD java -Dserver.port=${PORT} -jar app.jar

