# ClawdSales Norway - Setup Guide

This guide will walk you through setting up ClawdSales Norway from scratch.

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Node.js 20+** installed ([Download](https://nodejs.org/))
- [ ] **PostgreSQL 16+** installed OR Docker Desktop
- [ ] **Git** installed
- [ ] **OpenAI API key** (or compatible AI provider)
- [ ] **Terminal/Command line** access

---

## 🚀 Installation Steps

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd SALG
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (~5 minutes on first run).

### Step 3: Configure Environment

Create `.env` file from template:

```bash
cp .env.example .env
```

Open `.env` in your editor and configure:

#### Required Variables

```env
# Database - Use one of these options:

# Option A: Docker (easiest)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clawdsales?schema=public"

# Option B: Local PostgreSQL
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/clawdsales?schema=public"

# Option C: Remote (Heroku, Supabase, etc.)
DATABASE_URL="postgresql://user:pass@remote-host:5432/dbname?schema=public"

# Auth - Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET="REPLACE_WITH_RANDOM_STRING"
NEXTAUTH_URL="http://localhost:3000"

# AI Provider
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-YOUR-OPENAI-KEY-HERE"
AI_MODEL="gpt-4o-mini"

# Norwegian API (usually no changes needed)
BRREG_BASE_URL="https://data.brreg.no"
BRREG_USER_AGENT="ClawdSalesNorway/0.1.0 (your-email@example.com)"
```

#### Optional Variables

```env
# Redis for job queue (optional but recommended for production)
REDIS_URL="redis://localhost:6379"
```

### Step 4: Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait 10 seconds for PostgreSQL to initialize
sleep 10

# Generate Prisma Client
npm run db:generate

# Create database schema
npm run db:push

# Seed with demo data
npm run db:seed
```

#### Option B: Using Local PostgreSQL

```bash
# Create database
createdb clawdsales

# Generate Prisma Client
npm run db:generate

# Create database schema
npm run db:push

# Seed with demo data
npm run db:seed
```

### Step 5: Verify Setup

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the login page. Use these credentials:

```
Email: admin@clawdsales.no
Password: admin123
```

---

## ✅ Post-Setup Verification

### Check Database Connection

```bash
# Open Prisma Studio to browse database
npm run db:studio
```

This opens [http://localhost:5555](http://localhost:5555) where you can see:
- 1 User (admin)
- 3 Sample companies
- Score explanations
- Filter presets

### Run Initial Sync (Optional)

⚠️ **Warning:** Full sync takes a long time (hours) and fetches thousands of companies.

For testing, use incremental sync:

```bash
npm run sync:incremental
```

Or trigger via UI:
1. Log in to the app
2. Go to **Companies** page
3. Click **"Run Sync"** button
4. Monitor progress in **Sync Jobs** page

---

## 🐛 Troubleshooting

### Issue: Database Connection Failed

**Symptoms:**
```
Error: Can't reach database server
```

**Solutions:**

1. Check PostgreSQL is running:
```bash
# Docker
docker-compose ps

# Local
pg_isready
```

2. Verify DATABASE_URL in `.env`:
   - Host should be `localhost` (or `postgres` if using Docker network)
   - Port should be `5432` (default)
   - Check username/password

3. Restart database:
```bash
# Docker
docker-compose restart postgres

# Local
brew services restart postgresql@16  # macOS
sudo systemctl restart postgresql    # Linux
```

### Issue: Prisma Client Not Generated

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npm run db:generate
```

### Issue: Port 3000 Already in Use

**Symptoms:**
```
Error: Port 3000 is already in use
```

**Solutions:**

1. Find and kill process:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. Or use different port:
```bash
PORT=3001 npm run dev
```

### Issue: AI Summaries Not Generating

**Symptoms:**
- Regenerate button does nothing
- Summaries show "No AI summary available"

**Solutions:**

1. Check AI_API_KEY in `.env`:
```bash
# Test OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $AI_API_KEY"
```

2. Verify quota/limits on OpenAI dashboard

3. Check server logs for errors:
```bash
# Docker
docker-compose logs -f app

# Local dev server
# Errors appear in terminal
```

### Issue: npm install Fails

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solutions:**

1. Use Node Version Manager (nvm):
```bash
nvm install 20
nvm use 20
npm install
```

2. Clear npm cache:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🔄 Database Reset

If you need to start fresh:

```bash
# Reset database (deletes all data)
npx prisma migrate reset

# Re-seed
npm run db:seed
```

---

## 🐳 Docker Setup (Alternative)

If you prefer to run everything in Docker:

### Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Next.js app (port 3000)

### Setup Database

```bash
# Generate Prisma Client
docker-compose exec app npm run db:generate

# Push schema
docker-compose exec app npm run db:push

# Seed data
docker-compose exec app npm run db:seed
```

### View Logs

```bash
# All services
docker-compose logs -f

# Just app
docker-compose logs -f app
```

### Stop Services

```bash
docker-compose down
```

---

## 📊 Data Import

### Import Real Norwegian Companies

```bash
# Incremental sync (recommended for first time)
npm run sync:incremental

# Full sync (takes hours!)
npm run sync:full
```

Monitor progress:
- In terminal (progress logs)
- Or in UI: Sync Jobs page

### Batch AI Summary Generation

After importing companies, generate AI summaries for high-score leads:

```bash
# Will be implemented in Phase 2
# For now, use "Regenerate" button in UI for individual companies
```

---

## 🎯 Next Steps

1. ✅ Verify login works
2. ✅ Check dashboard shows stats
3. ✅ Browse sample companies
4. ✅ Test company detail drawer
5. ✅ Try filtering companies
6. ✅ Export test CSV
7. ✅ Run incremental sync
8. ✅ Generate AI summary for a company

---

## 📚 Additional Resources

- [Main README](./README.md) - Full documentation
- [Prisma Docs](https://www.prisma.io/docs) - Database reference
- [Next.js Docs](https://nextjs.org/docs) - Framework guide
- [Brønnøysundregistrene API](https://data.brreg.no/enhetsregisteret/api/docs/index.html) - Data source

---

## 🆘 Getting Help

If you're still stuck:

1. Check existing GitHub issues
2. Open new issue with:
   - Error message
   - Steps to reproduce
   - Environment info (OS, Node version, etc.)
3. Contact: your-email@example.com

---

**Setup complete! 🎉 You're ready to start prospecting.**
