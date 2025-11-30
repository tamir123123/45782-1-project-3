FROM mysql:8.0

# Set environment variables
ENV MYSQL_ALLOW_EMPTY_PASSWORD=1
ENV MYSQL_DATABASE=vacations

# Copy the SQL script to initialize the database
COPY --chmod=644 vacations.sql /docker-entrypoint-initdb.d/vacations.sql
