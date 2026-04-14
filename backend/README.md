# BudgetGo Backend (Spring Boot)

Minimal Spring Boot API to pair with the BudgetGo frontend.

## Prerequisites
- Java 17+
- Maven 3.8+
- MySQL running and reachable (or update the URL/credentials)

## Configure
Edit `src/main/resources/application.properties`:
- `spring.datasource.url` (e.g., `jdbc:mysql://localhost:3306/budgetgo`)
- `spring.datasource.username` / `spring.datasource.password`
- `server.port` (default `4000` to match the frontend dev setup)

## Run
```bash
mvn spring-boot:run
```

Health check:
- GET `http://localhost:4000/api/health`

Demo login (placeholder until real DB auth is wired):
- POST `http://localhost:4000/api/login` with body:
  ```json
  { "email": "admin@budgetgo.com", "password": "admin123" }
  ```

