# 🎉 NYE FUNKSJONER I CLAVIX

Alle funksjoner fra roadmapen er nå implementert! Her er en komplett guide.

---

## 🌍 NORDIC EXPANSION - Sverige, Danmark, Finland

### Oversikt
CLAVIX støtter nå bedriftsdata fra alle nordiske land!

| Land | Registry | API Status | Gratis? |
|------|----------|------------|---------|
| 🇳🇴 Norge | Brønnøysundregistrene | ✅ Aktivt | ✅ Ja |
| 🇸🇪 Sverige | Bolagsverket | ⚠️ Krever API-nøkkel | ❌ Nei |
| 🇩🇰 Danmark | CVR | ✅ Aktivt | ✅ Ja |
| 🇫🇮 Finland | YTJ | ✅ Aktivt | ✅ Ja |

### API Endpoints

#### Synkroniser bedrifter fra et land
```bash
POST /api/nordic/sync
Content-Type: application/json

{
  "country": "DK",  # "SE", "DK", "FI", eller "ALL"
  "limit": 100
}
```

#### Hent registry-status
```bash
GET /api/nordic/sync

# Response:
{
  "registries": [
    {
      "country": "DK",
      "registryName": "CVR (Centrale Virksomhedsregister)",
      "count": 1250,
      "lastSyncAt": "2026-02-07T12:00:00Z",
      "isActive": true
    }
  ]
}
```

### Hvordan bruke

1. **Sett miljøvariabler** (se `ENVIRONMENT-VARIABLES.md`)
   ```bash
   CVR_BASE_URL="https://cvrapi.dk"
   YTJ_BASE_URL="https://avoindata.prh.fi/bis/v1"
   BOLAGSVERKET_API_KEY="<hvis-tilgjengelig>"
   ```

2. **Kjør synkronisering**
   ```bash
   # Via API
   curl -X POST http://localhost:3000/api/nordic/sync \
     -H "Content-Type: application/json" \
     -d '{"country": "DK", "limit": 500}'
   
   # Eller via script (kommende)
   npm run sync:nordic -- --country=DK --limit=500
   ```

3. **Data lagres i `CompanyNordic` modellen**
   - Samme struktur som norske bedrifter
   - Kan scores og AI-oppsummeres
   - Vises i eget dashboard (kommende UI)

---

## 🎯 CUSTOM SCORING MODELS

### Oversikt
Brukere kan nå lage sine egne score-modeller med tilpassede vekter og betingelser!

### Standard Modeller (inkludert)
- ✅ **Standard CLAVIX-modell** - Balansert for alle bransjer
- ✅ **Enterprise-modell** - Fokuserer på store bedrifter (250+ ansatte)
- ✅ **SMB-modell** - Optimalisert for små/mellomstore (5-100 ansatte)

### API Endpoints

#### Hent alle modeller
```bash
GET /api/scoring-models

# Response:
{
  "models": [
    {
      "id": "default-standard",
      "name": "Standard CLAVIX-modell",
      "description": "Standard score-modell for alle bransjer",
      "isActive": false,
      "isDefault": true,
      "config": { ... }
    }
  ]
}
```

#### Opprett ny modell
```bash
POST /api/scoring-models
Content-Type: application/json

{
  "name": "Min Egendefinerte Modell",
  "description": "Fokuserer på tech-bedrifter",
  "isGlobal": false,  # true = tilgjengelig for alle (kun admin)
  "config": {
    "signals": [
      {
        "signal": "company_active",
        "weight": 20,
        "condition": "status === 'active'",
        "reason": "Bedriften er aktivt i drift"
      },
      {
        "signal": "tech_industry",
        "weight": 30,
        "condition": "industryCode?.startsWith('62')",
        "reason": "Tech-bransje"
      }
    ],
    "thresholds": {
      "highScore": 80,
      "goodScore": 60
    }
  }
}
```

#### Oppdater modell
```bash
PATCH /api/scoring-models
Content-Type: application/json

{
  "modelId": "abc123",
  "name": "Oppdatert navn",
  "isActive": true  # Aktiver denne modellen
}
```

#### Slett modell
```bash
DELETE /api/scoring-models?id=abc123
```

### Hvordan Conditions fungerer

Conditions evalueres mot bedriftsdata. Tilgjengelige felter:
- `status` - "active", "inactive", "unknown"
- `employeeCount` - antall ansatte
- `industryCode` - næringskode (f.eks. "52.10")
- `hasWebsite` - boolean
- `hasPhone` - boolean
- `hasEmail` - boolean
- `hasRolesData` - boolean
- `organizationFormCode` - org.form (f.eks. "AS")

**Eksempler:**
```javascript
// SMB-størrelse
"employeeCount >= 5 && employeeCount <= 100"

// Tech-bransje
"industryCode?.startsWith('62') || industryCode?.startsWith('63')"

// Komplett digital profil
"hasWebsite && hasPhone && hasEmail"

// Aksjeselskap
"organizationFormCode === 'AS'"
```

---

## 🔗 SLACK/TEAMS INTEGRATIONS

### Oversikt
Send sanntidsvarslinger til Slack, Microsoft Teams eller egendefinerte webhooks!

### Støttede Events
- `deal.created` - Ny deal opprettet
- `deal.won` - Deal vunnet! 🎉
- `deal.lost` - Deal tapt
- `lead.high_score` - Ny high-score lead (≥75)
- `company.synced` - Ny bedrift synkronisert
- Egendefinerte events...

### API Endpoints

#### Hent alle integrasjoner
```bash
GET /api/integrations

# Response:
{
  "integrations": [
    {
      "id": "abc123",
      "type": "slack",
      "name": "Sales Team Slack",
      "isActive": true,
      "config": {
        "webhookUrl": "https://hooks.slack.com/services/..."
      },
      "events": ["deal.created", "deal.won"],
      "logs": [...]
    }
  ]
}
```

#### Opprett ny integrasjon
```bash
POST /api/integrations
Content-Type: application/json

# Slack
{
  "type": "slack",
  "name": "Sales Team Slack",
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
  },
  "events": ["deal.created", "deal.won", "lead.high_score"]
}

# Teams
{
  "type": "teams",
  "name": "CRM Team Channel",
  "config": {
    "webhookUrl": "https://outlook.office.com/webhook/..."
  },
  "events": ["deal.created", "deal.won"]
}

# Generic Webhook
{
  "type": "webhook",
  "name": "Zapier Integration",
  "config": {
    "webhookUrl": "https://hooks.zapier.com/...",
    "token": "optional-bearer-token"
  },
  "events": ["deal.created", "deal.won", "lead.high_score"]
}
```

#### Trigger event manuelt (testing)
```bash
POST /api/integrations/trigger
Content-Type: application/json

{
  "event": "deal.won",
  "data": {
    "title": "Acme Corp - AI Automation",
    "value": 250000,
    "currency": "NOK",
    "companyName": "Acme Corp AS"
  }
}
```

### Hvordan sette opp

#### Slack
1. Gå til https://api.slack.com/apps
2. Opprett ny app eller velg eksisterende
3. Aktiver "Incoming Webhooks"
4. Kopier Webhook URL
5. Opprett integrasjon i CLAVIX med URL-en

#### Microsoft Teams
1. Åpne Teams-kanalen
2. Klikk "..." → "Connectors"
3. Søk etter "Incoming Webhook"
4. Konfigurer og kopier URL
5. Opprett integrasjon i CLAVIX med URL-en

#### Zapier
1. Opprett ny Zap
2. Velg trigger: "Webhooks by Zapier" → "Catch Hook"
3. Kopier webhook URL
4. Opprett integrasjon i CLAVIX med URL-en
5. Koble til hvilken som helst app (HubSpot, Salesforce, etc.)

---

## 📊 ALLE FEATURES - OPPSUMMERING

### ✅ Fullførte Roadmap Items

| Feature | Status | Beskrivelse |
|---------|--------|-------------|
| **Pipeline Management** | ✅ | Full CRM med deals, stages, activities |
| **Contact Enrichment** | ✅ | Hunter.io + Apollo.io integration |
| **Email Campaigns** | ✅ | Send og track email-kampanjer |
| **Team Collaboration** | ✅ | Multi-user, teams, roller, kommentarer |
| **Advanced Analytics** | ✅ | Charts, metrics, dashboards |
| **Advanced Filtering** | ✅ | Mange filtre + lagrede søk |
| **Automated Scoring** | ✅ | Cron-basert daglig oppdatering |
| **Nordic Expansion** | ✅ | Sverige, Danmark, Finland |
| **Custom Scoring** | ✅ | Brukerdefinerte score-modeller |
| **External API** | ✅ | v1 API for tredjepartsintegrasjoner |
| **Slack/Teams** | ✅ | Webhook-notifikasjoner |

### 🎨 Neste Steg (Fremtidige Features)

Disse er IKKE i scope for MVP, men kan legges til senere:
- Mobile app (React Native)
- Real-time collaboration (WebSockets)
- Advanced AI features (GPT-4, custom training)
- Video demos og onboarding
- Multi-tenant support

---

## 🚀 DEPLOYMENT TIL RAILWAY

### Miljøvariabler å sette

```bash
# Core (påkrevd)
DATABASE_URL=<auto-konfigurert av Railway>
NEXTAUTH_SECRET=<generer: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.railway.app
AI_API_KEY=<din OpenAI nøkkel>

# Brønnøysundregistrene (Norge)
BRREG_BASE_URL=https://data.brreg.no
BRREG_USER_AGENT=CLAVIX/1.0 (contact@clavix.no)

# Nordic (valgfritt)
CVR_BASE_URL=https://cvrapi.dk
YTJ_BASE_URL=https://avoindata.prh.fi/bis/v1
BOLAGSVERKET_API_KEY=<hvis tilgjengelig>

# Enrichment (valgfritt)
HUNTER_API_KEY=<hvis du vil bruke Hunter.io>
APOLLO_API_KEY=<hvis du vil bruke Apollo.io>

# Cron (valgfritt)
CRON_SECRET=<generer: openssl rand -base64 32>
```

### Railway Deployment Steps

1. **Push til GitHub** ✅ (allerede gjort!)
   ```bash
   git push origin main
   ```

2. **Koble Railway til GitHub**
   - Gå til Railway dashboard
   - New Project → Deploy from GitHub
   - Velg `Miramaps/Clavix`

3. **Legg til PostgreSQL**
   - New → Database → PostgreSQL
   - `DATABASE_URL` settes automatisk

4. **Sett miljøvariabler**
   - Settings → Variables
   - Lim inn variablene ovenfor

5. **Deploy!**
   - Railway deployer automatisk
   - Vent ca 2-3 minutter
   - Åpne app-URL når ferdig

6. **Kjør migrations & seed**
   ```bash
   # Railway kjører automatisk:
   # - npx prisma db push
   # - npm run db:seed (hvis du har lagt til i build-script)
   ```

---

## 📖 DOKUMENTASJON

- **`README.md`** - Hovedoversikt og quick start
- **`DEPLOYMENT.md`** - Detaljert deployment-guide
- **`ENVIRONMENT-VARIABLES.md`** - Alle environment variables
- **`NEW-FEATURES-GUIDE.md`** (denne filen) - Guide for nye features
- **`ALL-FEATURES-SUMMARY.md`** - Komplett feature-liste
- **`FEATURES-IMPLEMENTED.md`** - Teknisk feature-breakdown

---

## 🎓 EKSEMPLER

### Eksempel 1: Synkroniser danske bedrifter
```bash
curl -X POST https://your-app.railway.app/api/nordic/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"country": "DK", "limit": 1000}'
```

### Eksempel 2: Opprett custom scoring model for tech-bedrifter
```bash
curl -X POST https://your-app.railway.app/api/scoring-models \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Tech Startup Modell",
    "description": "Fokuserer på tech-startups med høyt vekstpotensial",
    "config": {
      "signals": [
        {
          "signal": "tech_industry",
          "weight": 30,
          "condition": "industryCode?.startsWith('62') || industryCode?.startsWith('63')",
          "reason": "Tech/IT-bransje"
        },
        {
          "signal": "small_team",
          "weight": 20,
          "condition": "employeeCount >= 3 && employeeCount <= 30",
          "reason": "Startup-størrelse"
        },
        {
          "signal": "has_website",
          "weight": 15,
          "condition": "hasWebsite === true",
          "reason": "Digital tilstedeværelse"
        }
      ],
      "thresholds": {
        "highScore": 75,
        "goodScore": 55
      }
    }
  }'
```

### Eksempel 3: Sett opp Slack-notifikasjoner
```bash
curl -X POST https://your-app.railway.app/api/integrations \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "type": "slack",
    "name": "Sales Team Notifications",
    "config": {
      "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    },
    "events": ["deal.created", "deal.won", "lead.high_score"]
  }'
```

---

## 🐛 TROUBLESHOOTING

### Problem: Nordic sync returnerer 0 resultater
**Løsning:** Sjekk at API-nøkler er satt korrekt i miljøvariabler.

### Problem: Custom scoring model fungerer ikke
**Løsning:** Sjekk at conditions bruker riktig syntax. Test i browser console først:
```javascript
const company = { status: 'active', employeeCount: 50 };
eval("status === 'active'");  // Bør returnere true
```

### Problem: Slack-integrasjonen sender ikke meldinger
**Løsning:** 
1. Sjekk at webhook URL er riktig
2. Test webhook direkte med curl:
   ```bash
   curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
     -H "Content-Type: application/json" \
     -d '{"text": "Test fra CLAVIX"}'
   ```
3. Sjekk integrasjonslogs i database: `IntegrationLog`

---

## 📞 SUPPORT

- **GitHub Issues:** https://github.com/Miramaps/Clavix/issues
- **Email:** contact@clavix.no
- **Documentation:** https://github.com/Miramaps/Clavix

---

**🎉 Gratulerer! CLAVIX er nå en fullverdig Nordic CRM-platform! 🎉**
