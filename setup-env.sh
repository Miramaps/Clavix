#!/bin/bash

# ClawdSales Norway - Environment Setup Script
# This creates a .env file with your configuration

echo "🔧 Setting up environment variables..."

cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clawdsales?schema=public"

# Auth
NEXTAUTH_SECRET="clawdsales-norway-secret-key-2026-production-grade-mvp"
NEXTAUTH_URL="http://localhost:3000"

# Brønnøysundregistrene API
BRREG_BASE_URL="https://data.brreg.no"
BRREG_USER_AGENT="ClawdSalesNorway/0.1.0 (sales@clawdsales.no)"

# AI Provider (OpenAI)
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-your-openai-api-key-here"
AI_MODEL="gpt-4o-mini"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# App
NODE_ENV="development"
EOF

echo "✅ Environment file created!"
echo ""
echo "⚠️  SECURITY NOTE:"
echo "Your OpenAI API key is now configured. Make sure to:"
echo "  1. Never commit .env to git (already in .gitignore)"
echo "  2. Use a separate key for production"
echo "  3. Monitor usage at platform.openai.com"
echo ""
echo "🚀 Next steps:"
echo "  1. Start database: docker-compose up -d postgres redis"
echo "  2. Setup DB: npm run db:generate && npm run db:push && npm run db:seed"
echo "  3. Start app: npm run dev"
echo ""
