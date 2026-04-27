# Render Deployment Guide

## Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/exam-system.git
git push -u origin main
```

## Step 2: Create Render Account
- Go to https://render.com
- Sign up with GitHub
- Authorize Render to access your repositories

## Step 3: Deploy NLP Service First

1. Click "New +" → "Web Service"
2. Select your `exam-system` repository
3. Configure:
   - **Name**: `exam-nlp-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r nlp-service/requirements.txt`
   - **Start Command**: `cd nlp-service && gunicorn -w 2 -b 0.0.0.0:$PORT app:app`
   - **Plan**: Free (or Starter for better performance)

4. Click "Create Web Service"
5. Wait for deployment (5-10 minutes)
6. Copy the service URL from the dashboard (e.g., `https://exam-nlp-service.onrender.com`)

## Step 4: Deploy Java Backend

1. Click "New +" → "Web Service"
2. Select your `exam-system` repository
3. Configure:
   - **Name**: `exam-backend`
   - **Environment**: `Java`
   - **Build Command**: `cd backend && mvn clean package -DskipTests`
   - **Start Command**: `java -jar backend/target/ExamPortalApplication-0.0.1-SNAPSHOT.jar` (or your JAR name)
   - **Plan**: Starter ($7/month minimum) - Free tier may timeout during build

4. Add Environment Variables:
   ```
   SPRING_DATASOURCE_URL=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
   SPRING_DATASOURCE_USERNAME=sa
   APP_JWT_SECRET=ExamPortalSecretKey2024CloudBasedNLPAutoEvaluationSystem
   NLP_SERVICE_URL=https://exam-nlp-service.onrender.com
   APP_CORS_ALLOWED_ORIGINS=https://exam-backend.onrender.com,https://exam-frontend.onrender.com,http://localhost:3000
   SPRING_PROFILES_ACTIVE=prod
   ```

5. Click "Create Web Service"
6. Wait for deployment (10-15 minutes)
7. Copy the backend URL

## Step 5: Deploy Frontend (Optional)

### Option A: Deploy to Vercel (Recommended for Frontend)
1. Push to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Set environment variable:
   ```
   VITE_API_URL=https://exam-backend.onrender.com
   ```
5. Deploy

### Option B: Deploy to Render as Static Site
1. Click "New +" → "Static Site"
2. Configure:
   - **Name**: `exam-frontend`
   - **Build Command**: (leave empty - static files)
   - **Publish Directory**: `frontend`

3. Update your frontend JS files to use the backend URL

## Step 6: Update Frontend API Configuration

Edit `frontend/js/api.js`:

```javascript
// Get backend URL from environment or use Render backend URL
const API_BASE_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:8080'
  : 'https://exam-backend.onrender.com';

const API_CONFIG = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
};
```

## Step 7: Test Deployment

1. Go to your backend URL: `https://exam-backend.onrender.com`
2. Check health: `https://exam-backend.onrender.com/health`
3. Check NLP service: `https://exam-nlp-service.onrender.com/health`
4. Test login at frontend URL

## Troubleshooting

### Build Fails
- Check logs in Render dashboard
- Ensure Java version is 17+ in pom.xml
- Run locally first: `mvn clean package`

### Service Can't Connect
- Verify CORS configuration includes your frontend URL
- Check environment variables are set correctly
- Check firewall/network logs

### Free Tier Issues
- Services go to sleep after 15 minutes of inactivity
- Use Starter plan ($7/month) for reliability
- Free tier may fail Java builds due to memory limits

### Database Issues
- Using H2 in-memory means data resets on redeploy
- For production, upgrade to PostgreSQL addon in Render

## Upgrade to PostgreSQL (Production)

1. In Render dashboard, click on backend service
2. Go to "Environment"
3. Add PostgreSQL database
4. Copy connection string
5. Update environment variable:
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://user:pass@host:port/dbname
   SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
   ```

## Important Notes

- **Free Tier Limits**: Services spin down after 15 min inactivity, causing 30-40s response time on first request
- **Java Builds**: Free tier may timeout during Maven build. Consider upgrading to Starter plan.
- **Data Persistence**: H2 in-memory database loses data on redeploy. Use PostgreSQL for production.
