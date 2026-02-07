# Environment Variables for CLAVIX

This document describes all environment variables used by CLAVIX.

## Core Configuration

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/clawdsales"

# NextAuth
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

## Norwegian Business Registry (Brønnøysundregistrene)

```bash
BRREG_BASE_URL="https://data.brreg.no"
BRREG_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
```

## AI / OpenAI Configuration

```bash
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"
```

## Nordic Expansion APIs

### Sweden (Bolagsverket)

```bash
BOLAGSVERKET_BASE_URL="https://api.bolagsverket.se"
BOLAGSVERKET_API_KEY="<your-api-key>"
```

**Note:** Bolagsverket requires an API key. The API is not freely available like Norway's.

### Denmark (CVR)

```bash
CVR_BASE_URL="https://cvrapi.dk"
CVR_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
```

**Note:** Denmark's CVR API is freely available!

### Finland (YTJ)

```bash
YTJ_BASE_URL="https://avoindata.prh.fi/bis/v1"
YTJ_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
```

**Note:** Finland's YTJ API is freely available!

## Contact Enrichment

```bash
# Hunter.io
HUNTER_API_KEY="<your-hunter-api-key>"

# Apollo.io
APOLLO_API_KEY="<your-apollo-api-key>"
```

## Integrations

### Slack

```bash
# Slack webhooks are configured per-integration in the admin UI
# No global env var needed
```

### Microsoft Teams

```bash
# Teams webhooks are configured per-integration in the admin UI
# No global env var needed
```

## Email Campaigns (Optional)

```bash
EMAIL_FROM="noreply@clavix.no"
EMAIL_SMTP_HOST="smtp.sendgrid.net"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="apikey"
EMAIL_SMTP_PASSWORD="<sendgrid-api-key>"
```

## Cron Jobs / Background Processing

```bash
# Redis (optional, for BullMQ)
REDIS_URL="redis://localhost:6379"

# Cron secret for API authentication
CRON_SECRET="<generate with: openssl rand -base64 32>"
```

## External API

```bash
# External API v1 (for third-party integrations)
# API keys are managed in the admin UI
```

## Railway Deployment

For Railway deployment, set these in the Railway dashboard:

1. Add PostgreSQL plugin → `DATABASE_URL` auto-configured
2. Add Redis plugin (optional) → `REDIS_URL` auto-configured
3. Set all other variables manually in Settings → Variables

## Generating Secrets

```bash
# Generate a random secret (32 characters base64)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Development vs Production

- **Development:** Copy `.env.example` to `.env` and fill in values
- **Production:** Set environment variables in your hosting platform (Railway, Vercel, etc.)

## Security Notes

- ⚠️ **NEVER** commit `.env` files to git
- ⚠️ Rotate `NEXTAUTH_SECRET` and `CRON_SECRET` regularly
- ⚠️ Use strong, unique API keys for all external services
- ⚠️ Limit API key permissions to only what's needed

## Minimal Setup (Norway Only)

If you only want to use Norwegian data, you need:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
BRREG_BASE_URL="https://data.brreg.no"
BRREG_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"
```

## Full Nordic Setup

For full Nordic coverage, add:

```bash
# All core variables above, plus:
CVR_BASE_URL="https://cvrapi.dk"
CVR_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
YTJ_BASE_URL="https://avoindata.prh.fi/bis/v1"
YTJ_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
BOLAGSVERKET_BASE_URL="https://api.bolagsverket.se"
BOLAGSVERKET_API_KEY="<if-available>"
```

Denmark and Finland APIs are free! Sweden requires an API key from Bolagsverket.
