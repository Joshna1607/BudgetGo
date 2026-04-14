# 🚀 BudgetGo Deployment Guide

Deploying a full-stack application involves hosting three separate components: your **MySQL Database**, your **Spring Boot Backend**, and your **React Frontend**. 

Here is the recommended free/low-cost deployment stack for your project:
1. **Database:** Railway or Aiven (MySQL)
2. **Backend:** Render or Railway (Spring Boot)
3. **Frontend:** Vercel or Netlify (React + Vite)

---

## Phase 1: Preparation (Crucial Changes Needed)

Before deploying, you need to make your code production-ready. You should not hardcode sensitive information (like passwords or API keys) in your `application.properties`.

### 1. Update Backend `application.properties`
Change your `application.properties` to use **Environment Variables**. This keeps your credentials secure and allows you to inject different values in production.

```properties
spring.application.name=budgetgo-backend
server.port=${PORT:4001}

# --- Database ---
spring.datasource.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?createDatabaseIfNotExist=true
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Frontend URL
app.frontend.url=${FRONTEND_URL:http://localhost:3000}

# --- APIs & Secrets ---
razorpay.key.id=${RAZORPAY_KEY}
razorpay.key.secret=${RAZORPAY_SECRET}
gemini.api.key=${GEMINI_API_KEY}

# --- Google OAuth2 ---
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
# ... Keep the rest of your OAuth and Email properties, replacing sensitive data with ${VARIABLE_NAME}
```

### 2. Update Backend CORS Configurations
Make sure your Spring Boot CORS configuration allows requests from your future production frontend URL, not just `localhost:3000`. 
**(You'll likely pass this via the `${FRONTEND_URL}` environment variable).*

### 3. Update Frontend API Calls
Your React app currently points to `http://localhost:4001` or similar. Update this to point to a dynamic variable. 
In your Vite frontend, create a `.env` file (and make sure it is in `.gitignore`):
```env
VITE_API_BASE_URL=http://localhost:4001
```
Then update your Axios/fetch calls to use `import.meta.env.VITE_API_BASE_URL`.

---

## Phase 2: Deploying the Database (MySQL)

1. Go to [Railway](https://railway.app/) and create an account.
2. Click **New Project** -> **Provision MySQL**.
3. Once deployed, click on the MySQL block, go to the **Variables** or **Connect** tab.
4. Note down the credentials: `Host`, `Port`, `User`, `Password`, and `Database Name`. You'll need these for the backend.

---

## Phase 3: Deploying the Backend (Spring Boot)

We recommend using **Render.com**'s free tier for your backend.

1. **Commit to GitHub:** Push your entire project (or just the backend and frontend separately) to a GitHub repository.
2. Go to [Render](https://render.com/) and create an account.
3. Click **New** -> **Web Service** -> **Build and deploy from a Git repository**.
4. Connect your GitHub account and select your repository.
5. In the settings:
   - **Root Directory:** `backend` (if your pom.xml is inside the backend folder)
   - **Environment:** Java
   - **Build Command:** `./mvnw clean package -DskipTests` (Make sure you have a `mvnw` wrapper file in your backend folder, otherwise use `mvn clean package`)
   - **Start Command:** `java -jar target/budgetgo-backend-0.0.1-SNAPSHOT.jar` (Ensure this matches your actual `.jar` file name generated in target).
6. **Environment Variables:** Scroll down to the Environment Variables section and add all the variables you established in Phase 1 (e.g., `DB_HOST`, `DB_PASSWORD`, `RAZORPAY_KEY`, etc.).
7. Click **Deploy**. Note down the URL Render gives your backend (e.g., `https://budgetgo-backend.onrender.com`).

---

## Phase 4: Deploying the Frontend (React + Vite)

**Vercel** is the easiest platform for Vite applications.

1. Go to [Vercel](https://vercel.com/) and log in with GitHub.
2. Click **Add New Project** and select your GitHub repository.
3. In the Configuration page:
   - **Root Directory:** `.` (or the folder where `package.json` and `vite.config.js` live).
   - **Framework Preset:** Vite
4. **Environment Variables:** Add your `VITE_API_BASE_URL` and set its value to your Render backend URL (e.g., `https://budgetgo-backend.onrender.com`).
5. Click **Deploy**.

---

## Phase 5: Final Connections

1. **Update OAuth Callbacks:** Since you are using Google OAuth, go to your [Google Cloud Console](https://console.cloud.google.com/), find your OAuth credentials, and update the **Authorized redirect URIs** to include your new production backend URL, e.g., `https://budgetgo-backend.onrender.com/login/oauth2/code/google`.
2. **Update Backend Frontend URL:** Go back to Render's Environment Variables and make sure `FRONTEND_URL` is set to your new Vercel URL so CORS doesn't block the frontend.
