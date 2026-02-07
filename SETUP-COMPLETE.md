# 🚀 Complete Setup Guide - ClawdSales Norway

Your OpenAI API key has been configured! ✅

Now choose your setup path:

---

## Option 1: With Docker (Recommended)

### Install Docker Desktop

**macOS:**
```bash
# Download from https://www.docker.com/products/docker-desktop/
# Or with Homebrew:
brew install --cask docker
```

After installation:
```bash
# Start Docker Desktop app, then:
docker compose up -d postgres redis

# Wait 10 seconds for PostgreSQL to start
sleep 10

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Start app
npm run dev
```

---

## Option 2: Without Docker (Local PostgreSQL)

### Step 1: Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**macOS (Postgres.app):**
Download from https://postgresapp.com/

### Step 2: Create Database

```bash
# Create database
createdb clawdsales

# Test connection
psql clawdsales -c "SELECT version();"
```

### Step 3: Update Database URL

Your `.env` file should have:
```env
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/clawdsales?schema=public"
```

Replace `YOUR_USERNAME` with your macOS username (run `whoami` to find it).

### Step 4: Setup Database

```bash
cd /Users/dani/Desktop/SALG

# Generate Prisma Client
npm run db:generate

# Create tables
npm run db:push

# Seed with sample data
npm run db:seed
```

### Step 5: Start Application

```bash
npm run dev
```

---

## 🎯 Access the Application

Open: http://localhost:3000

**Login credentials:**
- Email: `admin@clawdsales.no`
- Password: `admin123`

---

## 🤖 AI Summary Generation

Your OpenAI API key is configured! You can now:

1. **Auto-generate summaries during sync:**
   ```bash
   # In Companies page, click "Run Sync"
   # Check "Generate AI summaries" option
   ```

2. **Manual generation:**
   - Click any company row
   - In the detail drawer, click "Regenerate" button
   - AI summary appears in ~2-3 seconds

### What the AI Generates:

Each company summary includes:
- ✅ **What they do** - Business description
- ✅ **Why automation** - Pain points and opportunities  
- ✅ **Top 3 use cases** - Specific solutions to sell
- ✅ **Pitch angle** - Recommended outreach approach
- ✅ **Risk notes** - Data gaps or concerns

### AI Metrics Calculated:

The system automatically calculates:
- **Overall Lead Score** (0-100) - Weighted sum of 9 signals
- **Use Case Fit** (0-100) - Industry/size match for automation
- **Urgency Score** (0-100) - Likelihood of near-term purchase
- **Data Quality** (0-100) - Contact information completeness

All metrics are visible in:
- Companies table (Overall Score column)
- Company detail drawer (full breakdown)
- Dashboard charts

---

## 📊 Sample Data Included

The seed script created:
- ✅ 3 Norwegian companies with realistic data
- ✅ Complete scoring with explanations
- ✅ Sample AI summaries
- ✅ Filter presets

---

## 🔄 Import Real Norwegian Companies

### Incremental Sync (Recommended)

```bash
npm run sync:incremental
```

This fetches companies updated in the last 7 days from Brønnøysundregistrene.

**Time:** ~5-10 minutes  
**Companies:** ~100-500 depending on activity

### Full Sync (Takes Hours!)

```bash
npm run sync:full
```

⚠️ **Warning:** This fetches ALL Norwegian companies (~1.2 million records)

**Time:** 4-8 hours  
**Companies:** ~1.2 million  
**Storage:** ~10-20 GB database size

### Via UI

1. Go to Companies page
2. Click "Run Sync" button
3. Select sync type
4. Monitor in Sync Jobs page

---

## 🎨 Key Features to Try

### 1. Filter by Score
Click "Hot Leads (≥75)" to see high-value prospects

### 2. Search Companies
Type company name or organization number

### 3. View Details
Click any row to open detail drawer with:
- Contact information
- Lead scoring breakdown
- AI summary
- Leadership roles
- Branch locations

### 4. Generate AI Summary
In detail drawer, click "Regenerate" to create fresh AI analysis

### 5. Export Data
Click "Export" button to download CSV with:
- All company data
- Scoring explanations
- AI summaries

### 6. Monitor Syncs
Navigate to "Sync Jobs" to see:
- Sync history
- Success/failure status
- Processed counts

---

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run type-check       # Verify TypeScript

# Database
npm run db:studio        # Browse database visually
npm run db:generate      # Update Prisma Client
npm run db:seed          # Add sample data

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode

# Sync
npm run sync:incremental # Fetch recent updates
npm run sync:full        # Full sync (takes hours!)
```

---

## 🐛 Troubleshooting

### Database connection error

**If using Docker:**
```bash
docker compose restart postgres
docker compose logs postgres
```

**If using local PostgreSQL:**
```bash
brew services restart postgresql@16
psql clawdsales -c "SELECT 1;"
```

### Port 3000 in use

```bash
lsof -ti:3000 | xargs kill -9
```

### AI summaries not generating

Check your API key:
```bash
cat .env | grep AI_API_KEY
```

Test OpenAI API:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-openai-api-key-here"
```

### Prisma errors

```bash
npm run db:generate
npx prisma db push --force-reset  # Nuclear option (deletes data)
```

---

## 📈 Production Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your production PostgreSQL URL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `AI_API_KEY` - Your OpenAI key
   - `NEXTAUTH_URL` - Your production URL

### Environment Variables Needed

```env
DATABASE_URL="postgresql://..."           # Required
NEXTAUTH_SECRET="..."                     # Required
NEXTAUTH_URL="https://yourapp.vercel.app" # Required
AI_API_KEY="sk-..."                       # Required
AI_API_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o-mini"
BRREG_BASE_URL="https://data.brreg.no"
BRREG_USER_AGENT="ClawdSalesNorway/0.1.0 (your-email@example.com)"
```

---

## 🔐 Security Notes

### Your API Key

✅ **Configured and ready!**

⚠️ **Important:**
- Never commit `.env` to git (already in `.gitignore`)
- Monitor usage at https://platform.openai.com/usage
- Set spending limits in OpenAI dashboard
- Use separate keys for dev/production

### Cost Estimates

**AI Summaries:**
- ~300-500 tokens per summary
- gpt-4o-mini: ~$0.001 per summary
- 1000 summaries: ~$1

**Recommended:**
- Generate summaries only for high-score leads (≥70)
- Batch process overnight
- Cache aggressively (already implemented)

---

## 📚 Documentation

- [README.md](./README.md) - Complete feature docs
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute start
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guide

---

## 🎯 Next Steps

1. ✅ Choose setup option (Docker or local PostgreSQL)
2. ✅ Run database setup commands
3. ✅ Start the application
4. ✅ Login and explore sample data
5. ✅ Generate AI summaries for sample companies
6. ✅ Run incremental sync to fetch real data
7. ✅ Start prospecting! 🇳🇴

---

**Need help?** Open an issue or contact support.

**Ready to launch!** 🚀
