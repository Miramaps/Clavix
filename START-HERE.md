# 🎯 START HERE - ClawdSales Norway

## ✅ What's Ready

Your OpenAI API key is configured and ready to generate AI summaries!

## 🚀 Quick Start (Choose One)

### Option A: With Docker
```bash
# 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
# 2. Start Docker, then run:
docker compose up -d postgres redis
sleep 10
npm run db:generate && npm run db:push && npm run db:seed
npm run dev
```

### Option B: Without Docker (Local PostgreSQL)
```bash
# 1. Install PostgreSQL:
brew install postgresql@16
brew services start postgresql@16

# 2. Create database:
createdb clawdsales

# 3. Update .env with your username:
# DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/clawdsales?schema=public"

# 4. Setup and start:
npm run db:generate && npm run db:push && npm run db:seed
npm run dev
```

## 🎫 Login

**URL:** http://localhost:3000

**Credentials:**
- Email: `admin@clawdsales.no`  
- Password: `admin123`

## 🤖 AI Features Now Active

### 1. AI Company Summaries ✅
Click any company → Click "Regenerate" button

**What it generates:**
- What the company does
- Why they need automation  
- Top 3 use cases to sell
- Recommended pitch angle
- Risk assessment

### 2. Automatic Lead Scoring ✅
Every company gets scored 0-100 based on:
- Company status (active/inactive)
- Employee count (5-250 = ideal)
- Industry targeting (operations-heavy)
- Multiple branches
- Website presence
- Contact info completeness
- Recent updates
- Commercial org type
- Leadership data

### 3. Multi-Dimensional Metrics ✅
Each company shows:
- **Overall Lead Score** (0-100)
- **Use Case Fit** (industry/size match)
- **Urgency Score** (buying likelihood)
- **Data Quality** (contact completeness)

## 📊 Try These Features

1. **Filter Hot Leads** - Click "Hot Leads (≥75)" button
2. **Search** - Type company name or org number
3. **Generate AI Summary** - Click any company → "Regenerate"
4. **Export CSV** - Export with scoring + AI summaries
5. **Run Sync** - Fetch real Norwegian companies
6. **View Dashboard** - Stats and trend charts

## 📚 Full Documentation

- **[SETUP-COMPLETE.md](./SETUP-COMPLETE.md)** - Complete setup guide
- **[README.md](./README.md)** - Full feature documentation  
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute guide

## 🆘 Quick Troubleshooting

**Database error?**
```bash
# Docker: docker compose restart postgres
# Local: brew services restart postgresql@16
```

**Port 3000 in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**AI not working?**
Check `.env` has your key:
```bash
cat .env | grep AI_API_KEY
```

## 🎉 You're All Set!

Your OpenAI key is configured. Just:
1. Choose Docker or Local PostgreSQL setup
2. Run the commands above
3. Start prospecting! 🇳🇴

---

**Quick support:** See SETUP-COMPLETE.md for detailed help
