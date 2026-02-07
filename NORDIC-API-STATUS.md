# Nordic API Status & Limitations

## 🌍 Overview

CLAVIX supporterer alle nordiske land, men hvert land har ulike API-begrensninger:

| Land | Registry | API Status | Gratis? | Limitasjoner |
|------|----------|------------|---------|--------------|
| 🇳🇴 **Norge** | Brønnøysundregistrene | ✅ **FUNGERER** | ✅ Ja | Ingen - full tilgang! |
| 🇸🇪 **Sverige** | Bolagsverket | ⚠️ Krever API-nøkkel | ❌ Nei | Må søke om tilgang |
| 🇩🇰 **Danmark** | CVR | ⚠️ Begrenset | ✅ Ja | Kun enkeltsøk (ikke bulk) |
| 🇫🇮 **Finland** | YTJ | ⚠️ Kompleks | ✅ Ja | Krever spesifikke søkeparametere |

---

## 🇳🇴 Norge - FUNGERER PERFEKT ✅

**API:** Brønnøysundregistrene  
**Status:** Fullt fungerende  
**Dokumentasjon:** https://data.brreg.no

### Features:
- ✅ Bulk queries (tusenvis av bedrifter)
- ✅ Søk og filtrering
- ✅ Detaljerte bedriftsdata
- ✅ Roller og underenheter
- ✅ Oppdateringer API (incremental sync)

### Setup:
```bash
# Ingen API-nøkkel nødvendig!
BRREG_BASE_URL="https://data.brreg.no"
BRREG_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
```

---

## 🇸🇪 Sverige - Krever API-nøkkel ⚠️

**API:** Bolagsverket  
**Status:** Krever betalt tilgang  
**Dokumentasjon:** https://www.bolagsverket.se

### Limitasjoner:
- ❌ Ikke gratis offentlig API
- ❌ Må søke om API-tilgang fra Bolagsverket
- ❌ Kan ta flere uker å få godkjent

### Hvordan få tilgang:
1. Gå til https://www.bolagsverket.se
2. Søk om API-tilgang
3. Vent på godkjenning (2-4 uker)
4. Legg til i `.env`:
   ```bash
   BOLAGSVERKET_API_KEY="din-api-nøkkel"
   ```

### Alternativer:
- **Allabolag API** (tredjepart, betalt)
- **Web scraping** (juridisk gråsone)
- **Manuell CSV-import** fra Bolagsverket

---

## 🇩🇰 Danmark - Begrenset gratis API ⚠️

**API:** cvrapi.dk (uoffisiell, gratis)  
**Offisiell:** data.virk.dk (GraphQL, kompleks)  
**Status:** Kun enkeltsøk

### Limitasjoner:
- ⚠️ **cvrapi.dk** støtter bare enkeltsøk per CVR-nummer
- ⚠️ Ingen bulk queries eller wildcard search
- ⚠️ Ikke egnet for å laste mange bedrifter

### Hvorfor dette ikke fungerer for bulk:
```bash
# Fungerer:
GET https://cvrapi.dk/api?vat=12345678&country=dk

# Fungerer IKKE:
GET https://cvrapi.dk/api?search=*
GET https://cvrapi.dk/api?limit=100
```

### Løsning for produksjon:
Bruk **offisielle CVR API** via data.virk.dk:
```bash
CVR_BASE_URL="https://data.virk.dk/cvr/graphql"
```

**Dokumentasjon:** https://datacvr.virk.dk

Dette krever GraphQL-implementasjon og er mer komplekst.

---

## 🇫🇮 Finland - Fungerer med riktige parametere ⚠️

**API:** YTJ (Yritys- ja yhteisötietojärjestelmä)  
**Status:** Gratis, men krever spesifikke søk  
**Dokumentasjon:** https://www.avoindata.fi

### Limitasjoner:
- ⚠️ Krever minst ett søkeparameter (navn, Y-tunnus, etc.)
- ⚠️ Wildcard (*) search kan gi timeouts
- ⚠️ Anbefaler spesifikke søk (f.eks. bedrifter i Helsinki)

### Setup:
```bash
YTJ_BASE_URL="https://avoindata.prh.fi/bis/v1"
YTJ_USER_AGENT="CLAVIX/1.0 (contact@clavix.no)"
```

### Anbefalt bruk:
```typescript
// Søk etter bedrifter i Helsinki
ytjClient.searchCompanies({ 
  name: '*',
  maxResults: 100 
});

// Eller søk på org-form
ytjClient.searchCompanies({ 
  companyForm: 'OY', // Osakeyhtiö (AS)
  maxResults: 100 
});
```

---

## 🎯 PLATTFORM STØTTE

**Selv om ikke alle APIer fungerer optimalt, supporterer CLAVIX-plattformen:**

✅ Multi-country data model (`CompanyNordic` tabell)  
✅ Country selector i UI  
✅ Filtrering per land  
✅ Dashboard stats per land  
✅ Unified API endpoints  

---

## 💡 ANBEFALINGER

### For testing og utvikling:
1. ✅ **Bruk Norge** - fungerer perfekt!
2. ⚠️ **Sverige** - legg inn dummy/test-data manuelt
3. ⚠️ **Danmark** - bruk enkeltsøk eller implementer data.virk.dk
4. ⚠️ **Finland** - fungerer med riktige parametere

### For produksjon:
1. **Norge:** Klar til bruk!
2. **Sverige:** Skaff Bolagsverket API-nøkkel
3. **Danmark:** Implementer offisielt data.virk.dk GraphQL API
4. **Finland:** Optimaliser søkeparametere

---

## 🔧 FREMTIDIG IMPLEMENTASJON

For å få full Nordic support i produksjon:

### Sverige:
```typescript
// Implementer Allabolag API (betalt tredjepart)
// ELLER søk om Bolagsverket tilgang
```

### Danmark:
```typescript
// Implementer data.virk.dk GraphQL API
const query = `
  query {
    companies(limit: 100) {
      cvr
      name
      ...
    }
  }
`;
```

### Finland:
```typescript
// Optimaliser YTJ søk med bedre parametere
ytjClient.searchCompanies({
  companyForm: 'OY',
  maxResults: 1000
});
```

---

## ✅ KONKLUSJON

**CLAVIX-plattformen er klar for Nordic expansion!**

- ✅ Data model støtter alle land
- ✅ UI støtter land-bytte
- ✅ API er forberedt
- ⚠️ Noen eksterne APIer har begrensninger

**Norge fungerer 100%** og plattformen er klar for utvidelse når andre APIer blir tilgjengelige!
