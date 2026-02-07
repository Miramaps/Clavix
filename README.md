# CLAVIX 🇳🇴

**AI-drevet salgsintelligens for norske bedrifter**

En produksjonsklar MVP som henter, indekserer og scorer norske bedrifter fra Brønnøysundregistrene for å identifisere verdifulle prospekter for AI-automatiseringssalg.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/clavix)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

📖 [Deployment Guide](./DEPLOYMENT.md) • 🐛 [Report Bug](https://github.com/Miramaps/Clavix/issues) • ✨ [Request Feature](https://github.com/Miramaps/Clavix/issues)

---

## 🎯 Features

### Core Functionality
- ✅ **Data Ingestion** - Automated sync from Brønnøysundregistrene APIs
- ✅ **Lead Scoring** - Intelligent scoring engine with explainability (0-100 scale)
- ✅ **AI Summaries** - Auto-generated company insights and sales angles (på norsk!)
- ✅ **Fast Search** - Real-time filtering and segmentation
- ✅ **Export** - CSV/JSON export with scoring data
- ✅ **Contact Enrichment** - Hunter.io + Apollo.io integration
- ✅ **Custom Scoring Models** - User-defined scoring configurations
- ✅ **Integrations** - Slack, Teams, Webhooks

### Full CRM Features
- ✅ **Pipeline Management** - Kanban-style deal tracking
- ✅ **Activities** - Log calls, meetings, emails, demos
- ✅ **Notes** - Team collaboration on deals
- ✅ **Email Campaigns** - Send and track email outreach
- ✅ **Advanced Analytics** - Charts, metrics, and insights
- ✅ **Team Collaboration** - Multi-user support with roles

### Lead Scoring Signals
The scoring engine evaluates companies based on:
- Company status (active/inactive)
- Employee count (sweet spot: 5-250 employees)
- Industry vertical targeting (operations-heavy sectors)
- Multiple branches/sub-entities
- Digital presence (website availability)
- Contact information completeness
- Recent registry updates
- Commercial organization form
- Decision-maker role data availability

### Technical Highlights
- **Type-safe end-to-end** - Full TypeScript with strict mode
- **Production-ready** - Docker setup, error handling, audit logging
- **Scalable architecture** - Queue support with BullMQ + Redis
- **Modern UI** - Minimalist Scandinavian design with dark mode
- **Fast table virtualization** - Handles 10k+ rows smoothly

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.7 |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | NextAuth v5 (credentials) |
| **UI Components** | Tailwind CSS + shadcn/ui + Radix UI |
| **Data Grid** | TanStack Table |
| **Data Fetching** | TanStack Query (React Query) |
| **Validation** | Zod |
| **Charts** | Recharts |
| **AI Provider** | OpenAI-compatible API (configurable) |
| **Queue (optional)** | BullMQ + Redis |
| **DevOps** | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (or Docker)
- PostgreSQL 16+ (or use Docker Compose)
- Redis (optional, for job queue)

### 1. Clone and Install

```bash
git clone <repository-url>
cd SALG
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clavix?schema=public"

# Auth
NEXTAUTH_SECRET="your-secret-key-here"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Brønnøysundregistrene API
BRREG_BASE_URL="https://data.brreg.no"
BRREG_USER_AGENT="CLAVIX/0.1.0 (contact@clavix.no)"

# AI Provider (OpenAI-compatible)
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-your-openai-key"
AI_MODEL="gpt-4o-mini"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:push

# Seed database with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) og logg inn med:
- **E-post:** admin@clavix.no
- **Passord:** admin123

---

## 🐳 Docker Setup (Recommended)

### Start All Services

```bash
# Start PostgreSQL + Redis + App
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Database Setup in Docker

```bash
# Generate Prisma Client
docker-compose exec app npm run db:generate

# Run migrations
docker-compose exec app npm run db:push

# Seed database
docker-compose exec app npm run db:seed
```

### Stop Services

```bash
docker-compose down
```

---

## 📊 Running Data Sync

### Manual Sync (CLI)

```bash
# Full sync - fetches all companies (WARNING: takes time!)
npm run sync:full

# Incremental sync - only updates since last sync
npm run sync:incremental
```

### Sync via UI

1. Navigate to **Companies** page
2. Click **"Run Sync"** button in the top-right
3. Monitor progress in **Sync Jobs** page

### Sync Types

| Type | Description | When to Use |
|------|-------------|-------------|
| **Full** | Fetches all companies from scratch | Initial setup or major refresh |
| **Incremental** | Only fetches updates since last sync | Daily/weekly updates |
| **Roles** | Fetches leadership/decision-maker data | Enrichment for high-score leads |
| **Sub-entities** | Fetches branch/location data | Enrichment for multi-location companies |

---

## 🎨 Application Structure

```
SALG/
├── app/                          # Next.js 15 app directory
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── companies/           # Main companies table + detail drawer
│   │   ├── dashboard/           # Stats overview
│   │   ├── pipeline/            # Sales pipeline (stub)
│   │   ├── sync/                # Sync job history
│   │   └── settings/            # Settings (stub)
│   ├── api/                     # API routes
│   │   ├── auth/                # NextAuth handlers
│   │   ├── companies/           # Company CRUD + filters
│   │   ├── sync/                # Sync trigger + status
│   │   ├── export/              # CSV/JSON export
│   │   └── dashboard/           # Dashboard stats
│   ├── login/                   # Login page
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   └── sidebar.tsx              # App navigation
├── lib/                         # Core business logic
│   ├── api/brreg/               # Norwegian API client
│   ├── scoring/                 # Lead scoring engine
│   ├── ai/                      # AI summary generation
│   ├── services/                # Data sync services
│   ├── auth/                    # NextAuth configuration
│   └── db/                      # Prisma client
├── prisma/                      # Database schema + migrations
├── jobs/                        # CLI scripts for sync
├── tests/                       # Unit tests
└── docker-compose.yml           # Local dev environment
```

---

## 📖 API Routes

### Companies

```http
GET /api/companies?page=1&limit=50&minScore=75&status=active
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `search` - Search by name or org number
- `status` - Filter by status (active/inactive)
- `minScore`, `maxScore` - Score range filter
- `municipality`, `county` - Location filters
- `industryCode` - Industry filter (prefix match)
- `minEmployees`, `maxEmployees` - Employee count range
- `hasPhone`, `hasWebsite`, `hasRoles` - Boolean filters
- `sortBy`, `sortOrder` - Sorting

```http
GET /api/companies/{id}
```

Returns full company details with roles, sub-entities, and score explanations.

```http
POST /api/companies/{id}/regenerate-summary
```

Triggers AI summary regeneration for a specific company.

### Sync

```http
POST /api/sync
Body: { "type": "incremental", "generateAI": false }
```

Triggers a sync job. Types: `full`, `incremental`, `roles`, `subentities`.

```http
GET /api/sync?limit=20
```

Returns sync job history.

### Export

```http
POST /api/export
Body: { "filters": {...}, "format": "csv" }
```

Exports filtered companies as CSV or JSON.

### Dashboard

```http
GET /api/dashboard/stats
```

Returns dashboard statistics and charts data.

---

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Type Checking

```bash
npm run type-check
```

---

## 🏗 Lead Scoring Algorithm

The scoring engine evaluates each company against 9 weighted signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Company Active | 20 | Operating status in registry |
| Optimal Employee Count | 15 | 5-250 employees (SMB sweet spot) |
| Target Industry | 20 | Operations-heavy sectors (warehousing, construction, etc.) |
| Multiple Branches | 10 | Has sub-entities/locations |
| Has Website | 8 | Digital presence indicator |
| Has Phone | 8 | Contact availability |
| Recently Updated | 8 | Updated in registry within 90 days |
| Commercial Org Form | 6 | AS, ASA, ENK, etc. |
| Has Roles Data | 5 | Leadership information available |

**Total Possible:** 100 points

**Component Scores:**
- **Use Case Fit** - How well the industry/size matches automation needs
- **Urgency Score** - Likelihood of near-term purchasing
- **Data Quality** - Completeness of contact and company information

---

## 🤖 AI Summary Generation

For each high-scoring company, the system can generate an AI summary including:

1. **What they do** - Business description (2 sentences)
2. **Why automation** - Pain points and opportunities
3. **Top 3 use cases** - Specific automation solutions to sell
4. **Pitch angle** - Recommended outreach approach
5. **Risk notes** - Data gaps or concerns

Summaries are cached in the database and can be regenerated on-demand.

**API Configuration:**
- Supports any OpenAI-compatible provider (OpenAI, Azure OpenAI, local models)
- Configurable via `AI_API_BASE_URL` and `AI_MODEL` env vars
- Falls back to rule-based summaries if AI fails

---

## 📈 Scaling Considerations

### Database Indexing
The schema includes indexes on commonly filtered fields:
- `orgnr`, `status`, `overallLeadScore`
- `municipality`, `industryCode`, `employeeCount`
- `lastSeenAt`

### Job Queue (BullMQ)
For production workloads, enable Redis and implement background jobs:
- Full sync can take hours - run via queue with progress tracking
- AI summary generation should be batched (rate limiting)
- Use separate workers for different job types

### API Rate Limiting
Brønnøysundregistrene API:
- Respect rate limits (implement backoff in client)
- Use incremental syncs for daily updates
- Cache frequently accessed data

### Caching Strategy
- AI summaries: cached in DB, regenerate on-demand
- API responses: use React Query cache (60s default)
- Static data (org forms, role types): cache in-memory

---

## 🔐 Security & Compliance

### Authentication
- Internal team access only (NextAuth credentials)
- Passwords hashed with bcrypt
- Session-based auth with JWT

### Audit Logging
All sensitive actions are logged:
- Sync job triggers
- CSV exports
- Manual data modifications

### Data Privacy
- Company data is public registry information
- Personal data (roles) should be handled per GDPR
- Implement data retention policies as needed
- Add consent tracking for contact enrichment

### Best Practices
- ✅ Use environment variables for secrets
- ✅ HTTPS in production
- ✅ Rate limiting on API routes (implement as needed)
- ✅ Input validation with Zod
- ⚠️ Add CSRF protection for production
- ⚠️ Implement role-based access control (RBAC) if team grows

---

## 🌍 Multi-Country Expansion

The architecture is designed to support expansion to other Nordic countries:

### Sweden
- API: Bolagsverket / Companies Registration Office
- Similar data model to Norway
- Add country field to Company model

### Denmark
- API: Erhvervsstyrelsen (CVR)
- JSON-based API
- Implement separate client in `lib/api/cvr/`

### Finland
- API: Finnish Patent and Registration Office (PRH)
- XML/JSON formats
- Add mapper for Finnish-specific fields

### Implementation Pattern
1. Create country-specific API client (`lib/api/{country}/`)
2. Implement unified mapper to shared Company model
3. Add country filter in UI
4. Run separate sync jobs per country
5. Localize scoring weights if needed

---

## 🐛 Known Limitations

### Current MVP Scope
- ❌ **Pipeline management** - Stub only, needs CRM features
- ❌ **Contact enrichment** - Framework ready, but no providers integrated
- ❌ **Email campaigns** - Not implemented
- ❌ **Team collaboration** - Single-user focused
- ❌ **Advanced analytics** - Basic charts only
- ❌ **Mobile app** - Web only

### Data Quality Issues
- Phone/email data is sparse in public registry
- Sub-entity sync is expensive (many API calls)
- Industry codes may not always reflect actual business
- AI summaries quality depends on available data

### Performance
- Full sync of all Norwegian companies takes hours
- Large exports (10k+ rows) may timeout
- AI summary generation is rate-limited by provider

---

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Prisma Errors

```bash
# Regenerate Prisma Client
npm run db:generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npm run db:studio
```

### Sync Failures

Check sync job logs in:
1. **UI**: Navigate to Sync Jobs page
2. **Database**: Query `SyncJob` table for error details
3. **Server logs**: `docker-compose logs -f app`

Common issues:
- Network errors: Check Brreg API status
- Rate limiting: Reduce batch size or add delays
- Invalid data: Check mapper functions for edge cases

### AI Summary Issues

If summaries fail to generate:
1. Verify `AI_API_KEY` is valid
2. Check `AI_API_BASE_URL` is correct
3. Review OpenAI API quotas/limits
4. Fallback to rule-based summaries (automatic)

---

## 🚀 Deployment

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

**Important:**
- Set `DATABASE_URL` to production PostgreSQL
- Set `NEXTAUTH_SECRET` to strong random value
- Configure `AI_API_KEY` in Vercel env vars
- Enable Vercel Postgres or use external provider

### Docker (Self-Hosted)

```bash
# Build production image
docker build -t clavix .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  clavix
```

### Environment Variables Checklist
- [ ] `DATABASE_URL` - Production database connection
- [ ] `NEXTAUTH_SECRET` - Strong random secret (32+ chars)
- [ ] `NEXTAUTH_URL` - Production URL
- [ ] `AI_API_KEY` - OpenAI or compatible API key
- [ ] `BRREG_USER_AGENT` - Contact email in user agent

---

## 📝 License

MIT License - see LICENSE file for details.

---

## 🤝 Contributing

This is an MVP for internal use. For enhancements:

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit pull request

---

## 📧 Support

For questions or issues:
- Open GitHub issue
- Contact: your-email@example.com

---

## 🎯 Roadmap

### Phase 2 (Post-MVP)
- [ ] Integrate contact enrichment providers (Hunter.io, Apollo, etc.)
- [ ] Add email campaign tools
- [ ] Implement full pipeline/CRM features
- [ ] Multi-user team collaboration
- [ ] Advanced filtering and saved searches
- [ ] Automated scoring updates (daily cron)

### Phase 3 (Scale)
- [ ] Sweden, Denmark, Finland support
- [ ] Custom scoring models per user
- [ ] API for external integrations
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Slack/Teams integrations

---

**Bygget med ❤️ for norske salgsteam.**

Sist oppdatert: 2026-02-07
