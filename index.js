const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Store active orders temporarily (in production, use a database)
const activeOrders = new Map();

client.once('ready', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Check if message starts with "order:"
    if (message.content.toLowerCase().startsWith('order:')) {
        await handleOrderCommand(message);
    }
});

async function handleOrderCommand(message) {
    const orderData = parseOrderInput(message.content);

    if (!orderData.isValid) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Invalid Order Format')
            .setDescription('Please use the correct format:\n`order: game name, current price, steam name, payment method`\n\n**Example:**\n`order: Cyberpunk 2077, $59.99, mysteamname, PayPal`')
            .setTimestamp();

        await message.reply({ embeds: [errorEmbed] });
        return;
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Store order data
    activeOrders.set(orderId, {
        ...orderData,
        userId: message.author.id,
        username: message.author.username,
        timestamp: new Date(),
        status: 'pending'
    });

    // Create order confirmation embed
    const orderEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎮 New Game Order')
        .setDescription('Please review your order details below:')
        .addFields(
            { name: '🎯 Game Name', value: orderData.gameName, inline: true },
            { name: '💰 Price', value: orderData.currentPrice, inline: true },
            { name: '🎮 Steam Name', value: orderData.steamName, inline: true },
            { name: '💳 Payment Method', value: orderData.paymentMethod, inline: true },
            { name: '👤 Ordered by', value: message.author.username, inline: true },
            { name: '🆔 Order ID', value: orderId, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Order System' });

    // Create action buttons
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${orderId}`)
                .setLabel('✅ Confirm Order')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`cancel_${orderId}`)
                .setLabel('❌ Cancel Order')
                .setStyle(ButtonStyle.Danger)
        );

    await message.reply({
        embeds: [orderEmbed],
        components: [actionRow]
    });
}

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const [action, orderId] = interaction.customId.split('_');
    const order = activeOrders.get(orderId);

    if (!order) {
        await interaction.reply({
            content: '❌ Order not found or has expired.',
            ephemeral: true
        });
        return;
    }

    // Only allow the order creator to interact
    if (interaction.user.id !== order.userId) {
        await interaction.reply({
            content: '❌ You can only interact with your own orders.',
            ephemeral: true
        });
        return;
    }

    if (action === 'confirm') {
        order.status = 'confirmed';

        const confirmEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Order Confirmed!')
            .setDescription('Your order has been confirmed and will be processed.')
            .addFields(
                { name: '🎯 Game', value: order.gameName, inline: true },
                { name: '💰 Price', value: order.currentPrice, inline: true },
                { name: '🆔 Order ID', value: orderId, inline: true }
            )
            .setTimestamp();

        await interaction.update({
            embeds: [confirmEmbed],
            components: []
        });

        // Send notification to admin channel (optional)
        // You can modify this to send to a specific channel
        console.log(`Order ${orderId} confirmed by ${order.username}`);

    } else if (action === 'cancel') {
        activeOrders.delete(orderId);

        const cancelEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Order Cancelled')
            .setDescription('Your order has been cancelled.')
            .setTimestamp();

        await interaction.update({
            embeds: [cancelEmbed],
            components: []
        });
    }
});

function parseOrderInput(input) {
    // Remove "order:" prefix and trim
    const orderContent = input.substring(6).trim();

    // Split by comma and trim each part
    const parts = orderContent.split(',').map(part => part.trim());

    if (parts.length !== 4) {
        return { isValid: false };
    }

    const [gameName, currentPrice, steamName, paymentMethod] = parts;

    // Basic validation
    if (!gameName || !currentPrice || !steamName || !paymentMethod) {
        return { isValid: false };
    }

    return {
        isValid: true,
        gameName,
        currentPrice,
        steamName,
        paymentMethod
    };
}

function generateOrderId() {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Error handling
client.on('error', console.error);

// Login to Discord
client.login(process.env.DISCORD_TOKEN);