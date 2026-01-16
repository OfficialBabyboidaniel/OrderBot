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

// Lagra aktiva beställningar tillfälligt (använd databas i produktion)
const activeOrders = new Map();

client.once('ready', () => {
    console.log(`✅ Boten är redo! Inloggad som ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    // Kolla efter hjälpkommando
    if (content === '!hjälp' || content === '!beställ' || content === '!hjälp-beställning') {
        await showHelpCommand(message);
        return;
    }

    // Kolla om meddelandet börjar med "beställ:"
    if (content.startsWith('beställ:')) {
        await handleOrderCommand(message);
    }
});

async function handleSlashOrderCommand(interaction) {
    const gameName = interaction.options.getString('spelnamn');
    const currentPrice = interaction.options.getString('pris');
    const steamName = interaction.options.getString('steam-namn');
    const paymentMethod = interaction.options.getString('betalningsmetod');

    const orderData = {
        isValid: true,
        gameName,
        currentPrice,
        steamName,
        paymentMethod
    };

    // Generera beställnings-ID
    const orderId = generateOrderId();

    // Lagra beställningsdata
    activeOrders.set(orderId, {
        ...orderData,
        userId: interaction.user.id,
        username: interaction.user.username,
        timestamp: new Date(),
        status: 'pending'
    });

    // Skapa beställningsbekräftelse
    const orderEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎮 Ny Spelbeställning')
        .setDescription('Vänligen granska din beställning nedan:')
        .addFields(
            { name: '🎯 Spelnamn', value: orderData.gameName, inline: true },
            { name: '💰 Pris', value: orderData.currentPrice, inline: true },
            { name: '🎮 Steam-namn', value: orderData.steamName, inline: true },
            { name: '💳 Betalningsmetod', value: orderData.paymentMethod, inline: true },
            { name: '👤 Beställd av', value: interaction.user.username, inline: true },
            { name: '🆔 Beställnings-ID', value: orderId, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Beställningssystem' });

    // Skapa åtgärdsknappar
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${orderId}`)
                .setLabel('✅ Bekräfta Beställning')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`cancel_${orderId}`)
                .setLabel('❌ Avbryt Beställning')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({
        embeds: [orderEmbed],
        components: [actionRow]
    });
}

async function handleSlashHelpCommand(interaction) {
    const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎮 Beställningsbot Hjälp')
        .setDescription('Välkommen till Spelbeställningssystemet!')
        .addFields(
            {
                name: '📝 Hur man beställer',
                value: '**Slash-kommando:** `/beställ`\n**Textkommando:** `beställ: spelnamn, pris, steam-namn, betalningsmetod`',
                inline: false
            },
            {
                name: '💡 Textkommando Exempel',
                value: '```beställ: Cyberpunk 2077, 599kr, mittsteamnamn, PayPal```',
                inline: false
            },
            {
                name: '✅ Vad händer sen',
                value: '• Boten skapar beställningsbekräftelse\n• Du kan bekräfta eller avbryta\n• Beställningen spåras med unikt ID\n• Admin får notifiering',
                inline: false
            },
            {
                name: '🔧 Kommandon',
                value: '`/beställ` - Skapa beställning med formulär\n`/hjälp` - Visa denna hjälp',
                inline: false
            }
        )
        .setFooter({ text: 'Beställningsbot • Använd /beställ för enkel beställning!' })
        .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed] });
}

async function showHelpCommand(message) {
    const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎮 Beställningsbot Hjälp')
        .setDescription('Välkommen till Spelbeställningssystemet!')
        .addFields(
            {
                name: '📝 Hur man beställer',
                value: '```beställ: spelnamn, pris, steam-namn, betalningsmetod```',
                inline: false
            },
            {
                name: '💡 Exempel',
                value: '```beställ: Cyberpunk 2077, 599kr, mittsteamnamn, PayPal\nbeställ: Elden Ring, 499kr, steamanvändare123, Swish```',
                inline: false
            },
            {
                name: '✅ Vad händer sen',
                value: '• Boten skapar beställningsbekräftelse\n• Du kan bekräfta eller avbryta\n• Beställningen spåras med unikt ID\n• Admin får notifiering',
                inline: false
            },
            {
                name: '🔧 Kommandon',
                value: '`!hjälp` - Visa detta hjälpmeddelande\n`!beställ` - Visa beställningsformat\n`beställ: ...` - Skapa ny beställning',
                inline: false
            }
        )
        .setFooter({ text: 'Beställningsbot • Skriv din beställning för att komma igång!' })
        .setTimestamp();

    await message.reply({ embeds: [helpEmbed] });
}

async function handleOrderCommand(message) {
    const orderData = parseOrderInput(message.content);

    if (!orderData.isValid) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Ogiltigt Beställningsformat')
            .setDescription('Vänligen använd rätt format:\n`beställ: spelnamn, pris, steam-namn, betalningsmetod`\n\n**Exempel:**\n`beställ: Cyberpunk 2077, 599kr, mittsteamnamn, PayPal`')
            .setTimestamp();

        await message.reply({ embeds: [errorEmbed] });
        return;
    }

    // Generera beställnings-ID
    const orderId = generateOrderId();

    // Lagra beställningsdata
    activeOrders.set(orderId, {
        ...orderData,
        userId: message.author.id,
        username: message.author.username,
        timestamp: new Date(),
        status: 'pending'
    });

    // Skapa beställningsbekräftelse
    const orderEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎮 Ny Spelbeställning')
        .setDescription('Vänligen granska din beställning nedan:')
        .addFields(
            { name: '🎯 Spelnamn', value: orderData.gameName, inline: true },
            { name: '💰 Pris', value: orderData.currentPrice, inline: true },
            { name: '🎮 Steam-namn', value: orderData.steamName, inline: true },
            { name: '💳 Betalningsmetod', value: orderData.paymentMethod, inline: true },
            { name: '👤 Beställd av', value: message.author.username, inline: true },
            { name: '🆔 Beställnings-ID', value: orderId, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Beställningssystem' });

    // Skapa åtgärdsknappar
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${orderId}`)
                .setLabel('✅ Bekräfta Beställning')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`cancel_${orderId}`)
                .setLabel('❌ Avbryt Beställning')
                .setStyle(ButtonStyle.Danger)
        );

    await message.reply({
        embeds: [orderEmbed],
        components: [actionRow]
    });
}

// Hantera slash-kommando interaktioner
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'beställ') {
            await handleSlashOrderCommand(interaction);
        } else if (interaction.commandName === 'hjälp') {
            await handleSlashHelpCommand(interaction);
        }
        return;
    }

    if (!interaction.isButton()) return;

    const [action, orderId] = interaction.customId.split('_');
    const order = activeOrders.get(orderId);

    if (!order) {
        await interaction.reply({
            content: '❌ Beställning hittades inte eller har utgått.',
            ephemeral: true
        });
        return;
    }

    // Tillåt endast beställningsskaparen att interagera
    if (interaction.user.id !== order.userId) {
        await interaction.reply({
            content: '❌ Du kan bara interagera med dina egna beställningar.',
            ephemeral: true
        });
        return;
    }

    if (action === 'confirm') {
        order.status = 'confirmed';

        const confirmEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Beställning Bekräftad!')
            .setDescription('Din beställning har bekräftats och kommer att behandlas.')
            .addFields(
                { name: '🎯 Spel', value: order.gameName, inline: true },
                { name: '💰 Pris', value: order.currentPrice, inline: true },
                { name: '🆔 Beställnings-ID', value: orderId, inline: true }
            )
            .setTimestamp();

        await interaction.update({
            embeds: [confirmEmbed],
            components: []
        });

        // Skicka notifiering till admin-kanal (valfritt)
        console.log(`Beställning ${orderId} bekräftad av ${order.username}`);

    } else if (action === 'cancel') {
        activeOrders.delete(orderId);

        const cancelEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Beställning Avbruten')
            .setDescription('Din beställning har avbrutits.')
            .setTimestamp();

        await interaction.update({
            embeds: [cancelEmbed],
            components: []
        });
    }
});

function parseOrderInput(input) {
    // Ta bort "beställ:" prefix och trimma
    const orderContent = input.substring(8).trim();

    // Dela upp med komma och trimma varje del
    const parts = orderContent.split(',').map(part => part.trim());

    if (parts.length !== 4) {
        return { isValid: false };
    }

    const [gameName, currentPrice, steamName, paymentMethod] = parts;

    // Grundläggande validering
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
    return 'BEST-' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

// Felhantering
client.on('error', console.error);

// Logga in på Discord
client.login(process.env.DISCORD_TOKEN);
