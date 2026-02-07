# Changelog

All notable changes to ClawdSales Norway will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-07

### Added
- Initial MVP release
- Brønnøysundregistrene API integration
- Full and incremental sync capabilities
- Lead scoring engine with 9 weighted signals
- AI-powered company summaries (OpenAI-compatible)
- Companies table with filtering and search
- Company detail drawer with full information
- Dashboard with stats and charts
- Export to CSV functionality
- NextAuth authentication (credentials)
- Docker Compose setup for local development
- Comprehensive README and setup documentation
- Unit tests for scoring engine
- Seed script with sample Norwegian companies

### Technical Details
- Next.js 15 (App Router)
- TypeScript with strict mode
- Prisma + PostgreSQL
- TanStack Table and Query
- Tailwind CSS + shadcn/ui
- Recharts for visualization
- BullMQ + Redis support (optional)

### Known Limitations
- Pipeline/CRM features are stubs
- Contact enrichment framework ready but no providers integrated
- No email campaign tools
- Single-user focused (no team features)
- Basic analytics only

## [Unreleased]

### Planned for v0.2.0
- Contact enrichment provider integrations
- Enhanced pipeline management
- Multi-user support with roles
- Advanced filtering and saved searches
- Automated daily sync cron
- Sweden/Denmark/Finland expansion prep

---

For full details, see [README.md](./README.md)
