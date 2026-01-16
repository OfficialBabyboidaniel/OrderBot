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

    const [action, ...rest] = interaction.customId.split('_');
    const orderId = rest.join('_');

    // Hantera betalningsbekräftelse
    if (action === 'payment' && rest[0] === 'confirmed') {
        const order = activeOrders.get(orderId);

        if (!order) {
            await interaction.reply({
                content: '❌ Beställning hittades inte.',
                ephemeral: true
            });
            return;
        }

        if (interaction.user.id !== order.userId) {
            await interaction.reply({
                content: '❌ Du kan bara bekräfta din egen betalning.',
                ephemeral: true
            });
            return;
        }

        order.status = 'payment_pending';

        const thankYouEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Tack för din betalning!')
            .setDescription('Vi har mottagit din betalningsbekräftelse och behandlar nu din beställning.')
            .addFields(
                { name: '🎯 Spel', value: order.gameName, inline: true },
                { name: '🆔 Beställnings-ID', value: orderId, inline: true },
                { name: '⏳ Status', value: 'Väntar på verifiering', inline: false },
                { name: '📝 Nästa steg', value: 'En moderator kommer att verifiera din betalning och kontakta dig här i tråden inom kort.', inline: false }
            )
            .setFooter({ text: 'Tack för ditt tålamod!' })
            .setTimestamp();

        await interaction.update({
            embeds: [thankYouEmbed],
            components: []
        });

        // Logga för admin
        console.log(`Betalning bekräftad för beställning ${orderId} av ${order.username}`);

        return;
    }

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
            .setDescription('Din beställning har bekräftats och kommer att behandlas.\n\n🔒 En privat tråd kommer att skapas för din beställning.')
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

        // Skapa privat tråd för beställningen
        try {
            await createOrderThread(interaction, order, orderId);
        } catch (error) {
            console.error('Fel vid skapande av tråd:', error);
            await interaction.followUp({
                content: '⚠️ Kunde inte skapa privat tråd. Kontakta en admin.',
                ephemeral: true
            });
        }

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

async function createOrderThread(interaction, order, orderId) {
    const channel = interaction.channel;

    // Skapa privat tråd
    const thread = await channel.threads.create({
        name: `🎮 Beställning ${orderId}`,
        autoArchiveDuration: 1440, // 24 timmar
        type: 12, // PRIVATE_THREAD
        reason: `Beställning för ${order.gameName}`,
        invitable: false // Endast mods kan lägga till fler
    });

    // Lägg till användaren i tråden
    await thread.members.add(interaction.user.id);

    // Beräkna 80% av priset (ta bort valuta och beräkna)
    const priceMatch = order.currentPrice.match(/[\d.,]+/);
    const priceValue = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
    const paymentAmount = (priceValue * 0.80).toFixed(2);

    // Skapa betalningsinstruktioner baserat på metod
    let paymentInstructions = '';
    let paymentButton = null;

    if (order.paymentMethod === 'Swish') {
        paymentInstructions = `
**💳 Swish-betalning:**
1. Öppna Swish-appen
2. Swisha **${paymentAmount} kr** (80% av Steam-priset ${order.currentPrice}) till: **${process.env.SWISH_NUMBER}**
3. **VIKTIGT:** Skriv detta i meddelandet:
   \`${order.gameName} - ${order.steamName}\`
4. Klicka på "✅ Bekräfta Betalning" nedan när du har swishat

⚠️ **Glöm inte att inkludera spelnamn och Steam-namn i Swish-meddelandet!**`;

        paymentButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`payment_confirmed_${orderId}`)
                    .setLabel('✅ Bekräfta Betalning')
                    .setStyle(ButtonStyle.Success)
            );
    } else if (order.paymentMethod === 'PayPal') {
        paymentInstructions = `
**💳 PayPal-betalning:**
1. Gå till: ${process.env.PAYPAL_LINK}
2. Skicka **${paymentAmount} EUR/kr** (80% av Steam-priset ${order.currentPrice})
3. **VIKTIGT:** Skriv detta i meddelandet:
   \`${order.gameName} - ${order.steamName}\`
4. Klicka på "✅ Bekräfta Betalning" nedan när du har betalat

⚠️ **Glöm inte att inkludera spelnamn och Steam-namn i PayPal-meddelandet!**`;

        paymentButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`payment_confirmed_${orderId}`)
                    .setLabel('✅ Bekräfta Betalning')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setLabel('💳 Öppna PayPal')
                    .setStyle(ButtonStyle.Link)
                    .setURL(process.env.PAYPAL_LINK)
            );
    }

    // Skicka beställningsdetaljer i tråden
    const orderDetailsEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 Beställningsdetaljer')
        .setDescription(`Hej ${interaction.user}! Här är din beställning:`)
        .addFields(
            { name: '🎯 Spelnamn', value: order.gameName, inline: true },
            { name: '💰 Steam-pris', value: order.currentPrice, inline: true },
            { name: '💵 Ditt pris (80%)', value: `${paymentAmount} kr`, inline: true },
            { name: '🎮 Steam-namn', value: order.steamName, inline: false },
            { name: '💳 Betalningsmetod', value: order.paymentMethod, inline: true },
            { name: '🆔 Beställnings-ID', value: orderId, inline: true },
            { name: '📅 Beställd', value: `<t:${Math.floor(order.timestamp.getTime() / 1000)}:F>`, inline: false }
        )
        .setFooter({ text: 'Följ instruktionerna nedan för att slutföra din beställning' })
        .setTimestamp();

    const paymentEmbed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('💰 Betalningsinstruktioner')
        .setDescription(paymentInstructions)
        .setFooter({ text: 'Klicka på knappen när du har slutfört betalningen' });

    await thread.send({
        content: `${interaction.user} - Din privata beställningstråd har skapats! 🎉`,
        embeds: [orderDetailsEmbed, paymentEmbed],
        components: paymentButton ? [paymentButton] : []
    });

    // Spara tråd-ID i ordern
    order.threadId = thread.id;

    // Notifiera användaren om tråden
    await interaction.followUp({
        content: `🔒 En privat tråd har skapats: ${thread}`,
        ephemeral: true
    });

    // Logga för admins
    console.log(`Privat tråd skapad: ${thread.name} (ID: ${thread.id}) för användare ${order.username}`);
}

// Felhantering
client.on('error', console.error);

// Logga in på Discord
client.login(process.env.DISCORD_TOKEN);
