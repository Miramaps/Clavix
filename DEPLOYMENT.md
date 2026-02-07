# 🚀 CLAVIX - Railway Deployment Guide

## Hvorfor Railway?

Railway er perfekt for CLAVIX fordi:
- ✅ **Ubegrenset PostgreSQL** - Kan håndtere millioner av norske bedrifter
- ✅ **Automatisk skalering** - Håndterer store synkroniseringer
- ✅ **Enkel deployment** - Push til GitHub → automatisk deploy
- ✅ **Gratis tier** - $5/måned gratis kreditt
- ✅ **Redis support** - For BullMQ job queue

---

## 📋 Deployment Steg

### 1. Opprett Railway-konto
1. Gå til [railway.app](https://railway.app)
2. Sign up med GitHub
3. Bekreft e-post

### 2. Opprett nytt prosjekt
1. Klikk **"New Project"**
2. Velg **"Deploy from GitHub repo"**
3. Velg **Miramaps/Clavix**
4. Railway vil automatisk detektere Next.js

### 3. Legg til PostgreSQL
1. I prosjektet, klikk **"+ New"**
2. Velg **"Database"** → **"Add PostgreSQL"**
3. Railway oppretter automatisk `DATABASE_URL`

### 4. (Valgfritt) Legg til Redis
1. Klikk **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway oppretter automatisk `REDIS_URL`

### 5. Sett miljøvariabler
I Railway dashboard, gå til **"Variables"** og legg til:

```bash
# Auth (generer ny med: openssl rand -base64 32)
NEXTAUTH_SECRET=din-sikre-nøkkel-her
NEXTAUTH_URL=https://din-app.railway.app

# Brønnøysundregistrene API
BRREG_BASE_URL=https://data.brreg.no
BRREG_USER_AGENT=CLAVIX/1.0 (contact@clavix.no)

# OpenAI API
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-din-openai-nøkkel
AI_MODEL=gpt-4o-mini
```

**OBS:** `DATABASE_URL` og `REDIS_URL` settes automatisk av Railway!

### 6. Deploy!
1. Railway vil automatisk bygge og deploye
2. Vent 3-5 minutter
3. Klikk på **"Settings"** → **"Generate Domain"** for å få en URL

### 7. Kjør database migrations
1. I Railway dashboard, gå til prosjektet ditt
2. Klikk på **"Service"** (Next.js appen)
3. Gå til **"Settings"** → **"Deploy"**
4. Under **"Custom Start Command"**, legg til:
   ```bash
   npx prisma db push && npm run start
   ```

Eller kjør manuelt via Railway CLI:
```bash
railway run npx prisma db push
railway run npm run db:seed
```

---

## 🔄 Synkronisering på Railway

### Manuell synkronisering via UI
1. Gå til `https://din-app.railway.app`
2. Logg inn
3. Gå til **"Bedrifter"**
4. Klikk **"Kjør synk"**

### Automatisk daglig synkronisering (anbefalt)
Bruk Railway Cron Jobs eller GitHub Actions:

**Alternativ 1: Railway Cron (anbefalt)**
1. Opprett en ny service i Railway
2. Velg **"Cron Job"**
3. Sett schedule: `0 2 * * *` (kl 02:00 hver natt)
4. Command: `npm run sync:incremental`

**Alternativ 2: GitHub Actions**
Se `.github/workflows/sync.yml` (opprett denne filen)

---

## 📊 Estimert kapasitet

Med Railway kan du enkelt håndtere:
- ✅ **1.5M+ norske bedrifter** (alle i Brønnøysundregistrene)
- ✅ **Daglige synkroniseringer** (incremental)
- ✅ **AI-oppsummeringer** for høy-score leads
- ✅ **Raske søk og filtrering**

### Databasestørrelse estimat:
- **Per bedrift:** ~5-10 KB (med raw JSON)
- **1.5M bedrifter:** ~7.5-15 GB
- **Railway PostgreSQL:** Støtter opptil 100GB+ på betalt plan

---

## 💰 Kostnader

### Railway Pricing:
- **Hobby Plan:** $5/måned (gratis kreditt)
  - 500 timer/måned
  - 8GB RAM
  - 100GB disk
  - Perfekt for MVP!

- **Pro Plan:** $20/måned
  - Ubegrenset timer
  - 32GB RAM
  - 500GB disk
  - Anbefalt for produksjon

### Estimert månedlig kostnad:
- **Railway Hobby:** $0-5/måned (dekket av gratis kreditt)
- **OpenAI API:** $5-20/måned (avhengig av AI-bruk)
- **Totalt:** ~$10-25/måned

---

## 🔧 Feilsøking

### Problem: Database connection failed
**Løsning:**
```bash
# Sjekk at DATABASE_URL er satt
railway variables

# Test database connection
railway run npx prisma db push
```

### Problem: Build failed
**Løsning:**
```bash
# Sjekk build logs i Railway dashboard
# Vanligvis pga. manglende miljøvariabler

# Test lokalt:
npm run build
```

### Problem: Sync tar for lang tid
**Løsning:**
- Bruk `sync:incremental` i stedet for `sync:full`
- Kjør full sync kun 1 gang
- Bruk BullMQ + Redis for background jobs

---

## 📈 Skalering

### Når du trenger mer kapasitet:

1. **Oppgrader Railway plan** ($20/måned for Pro)
2. **Aktiver Redis + BullMQ** for job queue
3. **Optimaliser database:**
   ```sql
   -- Kjør i Railway PostgreSQL:
   CREATE INDEX CONCURRENTLY idx_company_score ON "Company"("overallLeadScore" DESC);
   CREATE INDEX CONCURRENTLY idx_company_municipality ON "Company"("municipality");
   CREATE INDEX CONCURRENTLY idx_company_created ON "Company"("createdAt" DESC);
   ```

4. **Caching:** Aktiver Redis for API responses

---

## 🎯 Post-Deployment Checklist

- [ ] Database migrations kjørt
- [ ] Seed data lastet (valgfritt)
- [ ] Første synkronisering fullført
- [ ] Alle miljøvariabler satt
- [ ] Custom domain konfigurert (valgfritt)
- [ ] Monitoring satt opp
- [ ] Backup-strategi på plass
- [ ] Cron job for daglig sync aktivert

---

## 🔗 Nyttige lenker

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Docs](https://docs.railway.app)
- [Prisma Railway Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)
- [Next.js Railway Template](https://railway.app/template/next-js)

---

**Lykke til med deployment! 🚀🇳🇴**

Hvis du trenger hjelp, sjekk Railway docs eller kontakt support.
