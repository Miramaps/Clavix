# 🚀 QuickStart - ClawdSales Norway

Get up and running in 5 minutes!

## Prerequisites

- Node.js 20+
- Docker Desktop (or PostgreSQL locally)

## 1. Install

```bash
npm install
```

## 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
AI_API_KEY="sk-your-key-here"
```

## 3. Start Database

```bash
docker-compose up -d postgres redis
```

Wait 10 seconds for PostgreSQL to start.

## 4. Initialize Database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## 5. Start App

```bash
npm run dev
```

## 6. Login

Open [http://localhost:3000](http://localhost:3000)

**Login credentials:**
- Email: `admin@clawdsales.no`
- Password: `admin123`

## 🎯 What's Included

### Sample Data
- 3 Norwegian companies with scores
- Lead scoring explanations
- Filter presets

### Features to Try
1. **Dashboard** - View stats and charts
2. **Companies** - Browse and filter companies
3. **Company Detail** - Click any row to see details
4. **AI Summary** - Click "Regenerate" in detail drawer
5. **Export** - Export filtered results to CSV
6. **Sync** - Run incremental sync (button in Companies page)
7. **Sync Jobs** - Monitor sync history

## 📊 Next Steps

### Import Real Data

```bash
# Incremental sync (recommended first time)
npm run sync:incremental
```

This fetches recent company updates from Brønnøysundregistrene.

**Note:** Full sync (`npm run sync:full`) takes hours and fetches all companies.

### Explore the UI

- **Filter by score** - Click "Hot Leads (≥75)" chip
- **Search** - Type company name or org number
- **Sort columns** - Click any column header
- **View details** - Click any row
- **Regenerate AI** - In detail drawer, click "Regenerate"
- **Export data** - Click "Export" button, select filters

### Check Sync Status

Navigate to **Sync Jobs** in sidebar to see:
- Sync history
- Success/failure status
- Processed counts
- Error details

## 🛠 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:studio        # Browse database (http://localhost:5555)
npm run db:generate      # Regenerate Prisma Client
npm run db:push          # Push schema changes
npm run db:seed          # Seed demo data

# Testing
npm test                 # Run tests
npm run type-check       # Check TypeScript

# Sync (CLI)
npm run sync:full        # Full sync (takes hours!)
npm run sync:incremental # Incremental sync (recommended)

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

## 🐛 Troubleshooting

### Database connection error?

```bash
docker-compose restart postgres
```

### Port 3000 in use?

```bash
lsof -ti:3000 | xargs kill -9
```

### Prisma errors?

```bash
npm run db:generate
```

## 📚 Full Documentation

- [README.md](./README.md) - Complete documentation
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines

## 🆘 Need Help?

1. Check [SETUP.md](./SETUP.md) for detailed troubleshooting
2. Open GitHub issue
3. Contact support

---

**Happy prospecting! 🇳🇴**
