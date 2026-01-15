# Discord Ordering Bot

A Discord bot for handling game orders with a simple command format.

## Features

- Simple order format: `order: game name, current price, steam name, payment method`
- Interactive confirmation with buttons
- Order tracking with unique IDs
- User validation (only order creator can confirm/cancel)
- Docker support for easy deployment

## Docker Deployment (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd discord-ordering-bot
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Discord bot token and client ID.

3. **Deploy with Docker Compose:**
   ```bash
   # Build and start the bot
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop the bot
   docker-compose down
   ```

4. **Using npm scripts:**
   ```bash
   npm run docker:build  # Build the container
   npm run docker:up     # Start the bot
   npm run docker:logs   # View logs
   npm run docker:down   # Stop the bot
   ```

## Manual Setup (Alternative)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   - Copy `.env.example` to `.env`
   - Add your Discord bot token and client ID

3. **Run the bot:**
   ```bash
   npm start
   ```

## Discord Bot Setup

1. **Create a Discord Application:**
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the token to your `.env` file
   - Copy the Application ID to your `.env` file as CLIENT_ID

2. **Invite bot to your server:**
   - Go to OAuth2 > URL Generator
   - Select "bot" scope
   - Select permissions: Send Messages, Use Slash Commands, Read Message History
   - Use the generated URL to invite the bot

## Usage

### Order Format
```
order: game name, current price, steam name, payment method
```

### Examples
```
order: Cyberpunk 2077, $59.99, mysteamname, PayPal
order: Elden Ring, $49.99, steamuser123, Credit Card
order: Baldur's Gate 3, $59.99, bgfan2023, Crypto
```

### How it works
1. User sends an order message
2. Bot parses the order and creates a confirmation embed
3. User can confirm or cancel using buttons
4. Order is tracked with a unique ID

## Docker Configuration

The bot runs in a lightweight Alpine Linux container with:
- Node.js 18
- Non-root user for security
- Automatic restart policy
- Health checks
- Network isolation

## Order Status
- **Pending**: Order created, waiting for confirmation
- **Confirmed**: Order confirmed by user
- **Cancelled**: Order cancelled by user

## Notes
- Orders are stored in memory (use a database for production)
- Only the order creator can confirm/cancel their orders
- Invalid format orders will show an error message with examples
- Container automatically restarts unless manually stopped