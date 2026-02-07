# 🚀 CLAVIX - Railway Quick Start

## ✅ Koden er nå på GitHub!

**Repository:** https://github.com/Miramaps/Clavix

---

## 📋 Deploy til Railway (5 minutter)

### Steg 1: Opprett Railway-konto
1. Gå til **https://railway.app**
2. Klikk **"Login"** → **"Login with GitHub"**
3. Autoriser Railway

### Steg 2: Deploy fra GitHub
1. Klikk **"New Project"**
2. Velg **"Deploy from GitHub repo"**
3. Velg **"Miramaps/Clavix"**
4. Railway starter automatisk deployment!

### Steg 3: Legg til PostgreSQL
1. I prosjektet, klikk **"+ New"**
2. Velg **"Database"** → **"Add PostgreSQL"**
3. ✅ `DATABASE_URL` settes automatisk!

### Steg 4: Sett miljøvariabler
Klikk på **Next.js service** → **"Variables"** → **"+ New Variable"**

Legg til disse:

```bash
# Auth (generer ny: openssl rand -base64 32)
NEXTAUTH_SECRET=din-sikre-nøkkel-her
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Brønnøysundregistrene API
BRREG_BASE_URL=https://data.brreg.no
BRREG_USER_AGENT=CLAVIX/1.0 (contact@clavix.no)

# OpenAI API
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-din-openai-nøkkel
AI_MODEL=gpt-4o-mini
```

**Tips:** Railway har en variabel `${{RAILWAY_PUBLIC_DOMAIN}}` som automatisk setter riktig URL!

### Steg 5: Generer domene
1. Gå til **"Settings"** → **"Networking"**
2. Klikk **"Generate Domain"**
3. Du får en URL som: `clavix-production.up.railway.app`

### Steg 6: Kjør database migrations
1. Gå til **"Settings"** → **"Deploy"**
2. Under **"Custom Start Command"**, sett:
   ```bash
   npx prisma db push && npm run start
   ```
3. Klikk **"Redeploy"**

### Steg 7: Seed database (valgfritt)
1. Installer Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link til prosjekt:
   ```bash
   railway link
   ```

4. Kjør seed:
   ```bash
   railway run npm run db:seed
   ```

---

## 🎉 Ferdig!

Gå til din Railway URL og logg inn:
- **E-post:** admin@clavix.no
- **Passord:** admin123

---

## 📊 Synkroniser bedrifter

### Manuelt (via UI):
1. Gå til **"Bedrifter"**
2. Klikk **"Kjør synk"**
3. Vent 2-5 minutter (500 bedrifter)

### Via Railway CLI:
```bash
# Test sync (500 bedrifter)
railway run npm run sync:test

# Full sync (ALLE norske bedrifter - tar timer!)
railway run npm run sync:full
```

---

## 💰 Kostnader

**Railway Hobby Plan:**
- $5/måned gratis kreditt
- Perfekt for MVP med 500-10,000 bedrifter

**For 1.5M bedrifter:**
- Oppgrader til **Pro Plan** ($20/måned)
- PostgreSQL vil bruke ~10-15 GB

---

## 🔧 Nyttige kommandoer

```bash
# Se logs
railway logs

# Kjør kommandoer
railway run npm run sync:incremental

# Åpne database
railway connect postgres

# Deploy ny versjon
git push origin main
# Railway deployer automatisk!
```

---

## 📈 Neste steg

1. **Sett opp daglig sync:**
   - Bruk Railway Cron Jobs
   - Schedule: `0 2 * * *` (kl 02:00)
   - Command: `npm run sync:incremental`

2. **Legg til Redis (valgfritt):**
   - For BullMQ job queue
   - Håndterer store synkroniseringer bedre

3. **Custom domain:**
   - Gå til Settings → Networking
   - Legg til din egen domene

---

## 🐛 Feilsøking

**Problem: Build failed**
- Sjekk at alle miljøvariabler er satt
- Se build logs i Railway dashboard

**Problem: Database connection failed**
- Sjekk at PostgreSQL er lagt til
- Verifiser at `DATABASE_URL` er satt

**Problem: 401 Unauthorized**
- Sjekk at `NEXTAUTH_SECRET` er satt
- Generer ny med: `openssl rand -base64 32`

---

**🎉 Lykke til med CLAVIX på Railway!** 🇳🇴

For mer hjelp, se [DEPLOYMENT.md](./DEPLOYMENT.md)
