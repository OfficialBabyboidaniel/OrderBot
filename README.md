# Discord Beställningsbot

En Discord-bot för att hantera beställningar med ett enkelt kommandoformat.

## 🎯 Funktioner

- ✅ Enkelt beställningsformat med 3 obligatoriska fält + 1 valfritt
- 🔘 Interaktiv bekräftelse med knappar
- 🆔 Beställningsspårning med unika ID:n
- 🔒 Användarvalidering (endast beställningsskaparen kan bekräfta/avbryta)
- 🧵 Privata trådar för varje beställning
- 💳 Stöd för Swish och PayPal
- 🐳 Docker-stöd för enkel deployment
- 🔗 Backend API-integration
- 📊 MongoDB för datapersistens

## 📝 Beställningsfält

### Obligatoriska fält:
1. **Namn** - Ditt namn eller alias
2. **Discord username** - Ditt Discord-användarnamn (t.ex. `babyboidaniel` eller `user#1234`)
3. **Betalmetod** - `Swish` eller `PayPal`

### Valfria fält:
4. **Referral-kod** - Om du blivit hänvisad av en vän

## 🚀 Snabbstart

### Beställningsformat
```
beställ: namn, discord username, betalmetod, referral-kod
```

### Exempel
```
beställ: Daniel, babyboidaniel, Swish, REF123
beställ: Anna, anna#1234, PayPal
beställ: Erik, erik_gaming, Swish
```

### Hjälpkommandon
- `!hjälp` - Visa hjälpmeddelande
- `!beställ` - Visa beställningsformat

## 🔄 Arbetsflöde

1. **Skapa beställning** - Användaren skickar beställningsmeddelande
2. **Granska** - Boten visar bekräftelse-embed med alla detaljer
3. **Bekräfta** - Användaren klickar på ✅ Bekräfta eller ❌ Avbryt
4. **Privat tråd** - En privat tråd skapas automatiskt
5. **Betalning** - Användaren får betalningsinstruktioner i tråden
6. **Bekräfta betalning** - Användaren klickar på ✅ Bekräfta Betalning
7. **Verifiering** - Moderator verifierar och behandlar beställningen

## 🐳 Docker Deployment (Rekommenderat)

### 1. Klona och sätt upp
```bash
git clone https://github.com/OfficialBabyboidaniel/OrderBot.git
cd OrderBot
```

### 2. Skapa miljöfil
```bash
cp .env.example .env
```

Redigera `.env` och lägg till:
```env
DISCORD_TOKEN=din_bot_token_här
DISCORD_CLIENT_ID=ditt_client_id_här
ADMIN_CHANNEL_ID=admin_kanal_id
MONGODB_URI=mongodb://mongodb:27017/ordering_bot
SWISH_NUMBER=079-348-41-33
PAYPAL_LINK=https://www.paypal.com/paypalme/babyboidaniel
BACKEND_API_URL=http://localhost:3000
```

### 3. Starta med Docker Compose
```bash
# Bygg och starta boten
docker-compose up -d

# Visa loggar
docker-compose logs -f

# Stoppa boten
docker-compose down
```

### 4. NPM-skript
```bash
npm run docker:build  # Bygg container
npm run docker:up     # Starta boten
npm run docker:logs   # Visa loggar
npm run docker:down   # Stoppa boten
```

## 💻 Manuell Installation

### 1. Installera beroenden
```bash
npm install
```

### 2. Skapa miljöfil
```bash
cp .env.example .env
```
Redigera `.env` med dina värden.

### 3. Kör boten
```bash
npm start
```

## 🤖 Discord Bot Setup

### 1. Skapa Discord Application
1. Gå till https://discord.com/developers/applications
2. Klicka på "New Application"
3. Ge den ett namn och klicka "Create"

### 2. Skapa Bot
1. Gå till "Bot"-sektionen
2. Klicka "Add Bot"
3. Kopiera token till `.env` som `DISCORD_TOKEN`
4. Aktivera följande Privileged Gateway Intents:
   - ✅ Message Content Intent
   - ✅ Server Members Intent

### 3. Hämta Client ID
1. Gå till "General Information"
2. Kopiera "Application ID" till `.env` som `DISCORD_CLIENT_ID`

### 4. Bjud in bot till server
1. Gå till OAuth2 > URL Generator
2. Välj scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Välj Bot Permissions:
   - ✅ Send Messages
   - ✅ Create Public Threads
   - ✅ Create Private Threads
   - ✅ Send Messages in Threads
   - ✅ Manage Threads
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Use Slash Commands
4. Kopiera URL:en och öppna i webbläsare
5. Välj server och godkänn

## 📊 Beställningsstatus

| Status | Beskrivning |
|--------|-------------|
| `pending` | Beställning skapad, väntar på bekräftelse |
| `confirmed` | Beställning bekräftad av användare |
| `payment_pending` | Användaren har bekräftat betalning, väntar på verifiering |
| `processing` | Beställning behandlas |
| `completed` | Beställning slutförd |
| `cancelled` | Beställning avbruten |

## 🏗️ Teknisk Stack

- **Node.js** - Runtime
- **Discord.js v14** - Discord API wrapper
- **MongoDB** - Databas
- **Mongoose** - ODM för MongoDB
- **Docker** - Containerisering
- **Axios** - HTTP-klient för backend API

## 🔧 Docker-konfiguration

Boten körs i en lätt Alpine Linux-container med:
- Node.js 18
- Non-root användare för säkerhet
- Automatisk restart-policy
- Health checks
- Nätverksisolering

## 📝 Anteckningar

- Beställningar lagras både i minnet (Map) och i MongoDB
- Endast beställningsskaparen kan bekräfta/avbryta sina beställningar
- Ogiltiga format visar felmeddelande med exempel
- Container startar om automatiskt om inte manuellt stoppad
- Privata trådar arkiveras automatiskt efter 24 timmar

## 🔐 Säkerhet

- Bot token lagras säkert i miljövariabler
- Privata trådar endast tillgängliga för användare och moderatorer
- Användarvalidering på alla interaktioner
- Non-root Docker-användare

## 📄 Licens

MIT License - Se [LICENSE](LICENSE) för detaljer