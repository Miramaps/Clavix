# 🔧 Fikset Sync-feil

## Problemet:
- **401 Unauthorized** feil når du prøver å synkronisere
- Sesjonen din har utløpt pga. endringer i koden

## Løsning:

### Steg 1: Logg ut og inn igjen
1. Gå til **http://localhost:3000**
2. Klikk på **"Logg ut"** (hvis du ser det)
3. Logg inn på nytt med:
   - **E-post:** admin@clavix.no
   - **Passord:** admin123

### Steg 2: Test synkronisering
1. Gå til **"Bedrifter"**-siden
2. Klikk på **"Kjør synk"**-knappen
3. Det skal nå fungere! ✅

---

## Hva jeg har fikset:

### ✅ Bedre feilhåndtering:
- Hvis sesjonen utløper, får du en melding og blir sendt til login
- Bedre feilmeldinger i UI-et
- Automatisk redirect til login ved 401-feil

### ✅ Ny sikker NEXTAUTH_SECRET:
- Generert en ny, sikker nøkkel
- Dette fikser JWT-dekrypteringsfeil

---

## Hvis problemet fortsetter:

### Alternativ 1: Restart serveren
```bash
# Stopp serveren (Ctrl+C i terminalen)
# Start på nytt:
npm run dev
```

### Alternativ 2: Slett cookies
1. Åpne nettleserens Developer Tools (F12)
2. Gå til "Application" > "Cookies"
3. Slett alle cookies for localhost:3000
4. Refresh siden og logg inn på nytt

---

**Nå skal alt fungere perfekt!** 🚀
