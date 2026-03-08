const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

// Lagra aktiva beställningar tillfälligt (använd databas i produktion)
const activeOrders = new Map();

// Backend integration functions
async function sendOrderToBackend(orderData) {
    try {
        const response = await axios.post(`${BACKEND_API_URL}/api/orders`, {
            name: orderData.name,
            discord_username: orderData.discordUsername,
            payment_method: orderData.paymentMethod,
            referral_code: orderData.referralCode,
            discord_user_id: orderData.userId,
            status: orderData.status || 'pending',
            order_id: orderData.orderId
        });
        
        console.log('✅ Order sent to backend:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to send order to backend:', error.message);
        return null;
    }
}

async function updateOrderStatus(backendId, status, notes = null) {
    try {
        const response = await axios.put(`${BACKEND_API_URL}/api/orders/${backendId}`, {
            status,
            notes
        });
        
        console.log('✅ Order status updated in backend:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to update order status:', error.message);
        return null;
    }
}

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
    const name = interaction.options.getString('namn');
    const discordUsername = interaction.options.getString('discord-username');
    const paymentMethod = interaction.options.getString('betalningsmetod');
    const referralCode = interaction.options.getString('referral-kod');

    const orderData = {
        isValid: true,
        name,
        discordUsername,
        paymentMethod,
        referralCode
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
        .setTitle('🛒 Ny Beställning')
        .setDescription('Vänligen granska din beställning nedan:')
        .addFields(
            { name: '👤 Namn', value: orderData.name, inline: true },
            { name: '💬 Discord', value: orderData.discordUsername, inline: true },
            { name: '💳 Betalningsmetod', value: orderData.paymentMethod, inline: true },
            { name: '🎁 Referral-kod', value: orderData.referralCode || 'Ingen', inline: true },
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
        .setTitle('🛒 Beställningsbot Hjälp')
        .setDescription('Välkommen till Beställningssystemet!')
        .addFields(
            {
                name: '📝 Fält du måste fylla i',
                value: '1️⃣ **Namn** - Ditt namn eller alias\n2️⃣ **Discord username** - Ditt Discord-namn\n3️⃣ **Betalmetod** - Swish eller PayPal\n4️⃣ **Referral-kod** (valfritt)',
                inline: false
            },
            {
                name: '💡 Textkommando',
                value: '```beställ: namn, discord username, betalmetod, referral-kod```',
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
        .setTitle('🛒 Beställningsbot Hjälp')
        .setDescription('Välkommen till Beställningssystemet!')
        .addFields(
            {
                name: '📝 Fält du måste fylla i',
                value: '1️⃣ **Namn** - Ditt namn eller alias\n2️⃣ **Discord username** - Ditt Discord-namn\n3️⃣ **Betalmetod** - Swish eller PayPal\n4️⃣ **Referral-kod** (valfritt)',
                inline: false
            },
            {
                name: '📋 Format',
                value: '```beställ: namn, discord username, betalmetod, referral-kod```',
                inline: false
            },
            {
                name: '💡 Exempel',
                value: '```beställ: Daniel, babyboidaniel, Swish, REF123\nbeställ: Anna, anna#1234, PayPal```',
                inline: false
            },
            {
                name: '✅ Vad händer sen',
                value: '• Boten skapar beställningsbekräftelse\n• Du kan bekräfta eller avbryta\n• Beställningen spåras med unikt ID\n• Admin får notifiering',
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
        let errorDescription = '📝 **Fält du måste fylla i:**\n\n';
        errorDescription += '1️⃣ **Namn** - Ditt namn eller alias\n';
        errorDescription += '2️⃣ **Discord username** - Ditt Discord-namn\n';
        errorDescription += '3️⃣ **Betalmetod** - Swish eller PayPal\n';
        errorDescription += '4️⃣ **Referral-kod** (valfritt)\n\n';
        errorDescription += '**Format:**\n`beställ: namn, discord username, betalmetod, referral-kod`\n\n';
        errorDescription += '**Exempel:**\n`beställ: Daniel, babyboidaniel, Swish, REF123`\n`beställ: Anna, anna#1234, PayPal`';

        if (orderData.invalidPayment) {
            errorDescription = '❌ **Ogiltig betalmetod!**\n\nVälj mellan:\n• Swish\n• PayPal\n\n' + errorDescription;
        }

        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Ogiltigt Beställningsformat')
            .setDescription(errorDescription)
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
        .setTitle('🛒 Ny Beställning')
        .setDescription('Vänligen granska din beställning nedan:')
        .addFields(
            { name: '👤 Namn', value: orderData.name, inline: true },
            { name: '💬 Discord', value: orderData.discordUsername, inline: true },
            { name: '💳 Betalmetod', value: orderData.paymentMethod, inline: true },
            { name: '🎁 Referral-kod', value: orderData.referralCode || 'Ingen', inline: true },
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

    const customId = interaction.customId;

    // Hantera betalningsbekräftelse
    if (customId.startsWith('payment_confirmed_')) {
        const orderId = customId.replace('payment_confirmed_', '');
        const order = activeOrders.get(orderId);

        if (!order) {
            await interaction.reply({
                content: `❌ Beställning hittades inte. (ID: ${orderId})`,
                ephemeral: true
            });
            console.log(`Beställning inte hittad: ${orderId}. Aktiva beställningar:`, Array.from(activeOrders.keys()));
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
        
        // Update backend
        if (order.backendId) {
            await updateOrderStatus(order.backendId, 'payment_pending', 'Customer confirmed payment via Discord');
        }

        const thankYouEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Tack för din betalning!')
            .setDescription('Vi har mottagit din betalningsbekräftelse och behandlar nu din beställning.')
            .addFields(
                { name: '👤 Namn', value: order.name, inline: true },
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

    // Hantera bekräfta/avbryt beställning
    const [action, orderId] = customId.split('_');
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
        order.orderId = orderId;
        
        // Send order to backend
        const backendOrder = await sendOrderToBackend(order);
        if (backendOrder) {
            order.backendId = backendOrder.id;
            console.log(`Order ${orderId} saved to backend with ID ${backendOrder.id}`);
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Beställning Bekräftad!')
            .setDescription('Din beställning har bekräftats och kommer att behandlas.\n\n🔒 En privat tråd kommer att skapas för din beställning.')
            .addFields(
                { name: '👤 Namn', value: order.name, inline: true },
                { name: '💬 Discord', value: order.discordUsername, inline: true },
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

    if (parts.length < 3 || parts.length > 4) {
        return { isValid: false };
    }

    const [name, discordUsername, paymentMethod, referralCode] = parts;

    // Grundläggande validering
    if (!name || !discordUsername || !paymentMethod) {
        return { isValid: false };
    }

    // Validera betalmetod
    const validPaymentMethods = ['swish', 'paypal'];
    if (!validPaymentMethods.includes(paymentMethod.toLowerCase())) {
        return { isValid: false, invalidPayment: true };
    }

    return {
        isValid: true,
        name,
        discordUsername,
        paymentMethod,
        referralCode: referralCode || null
    };
}

function generateOrderId() {
    return 'BEST-' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

async function createOrderThread(interaction, order, orderId) {
    const channel = interaction.channel;

    // Skapa privat tråd
    const thread = await channel.threads.create({
        name: `🛒 Beställning ${orderId}`,
        autoArchiveDuration: 1440, // 24 timmar
        type: 12, // PRIVATE_THREAD
        reason: `Beställning för ${order.name}`,
        invitable: false // Endast mods kan lägga till fler
    });

    // Lägg till användaren i tråden
    await thread.members.add(interaction.user.id);

    // Skapa betalningsinstruktioner baserat på metod
    let paymentInstructions = '';
    let paymentButton = null;

    if (order.paymentMethod.toLowerCase() === 'swish') {
        paymentInstructions = `
**💳 Swish-betalning:**
1. Öppna Swish-appen
2. Swisha till: **${process.env.SWISH_NUMBER}**
3. **VIKTIGT:** Skriv detta i meddelandet:
   \`${order.name} - ${order.discordUsername}\`
4. Klicka på "✅ Bekräfta Betalning" nedan när du har swishat

⚠️ **Glöm inte att inkludera ditt namn och Discord-användarnamn i Swish-meddelandet!**`;

        paymentButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`payment_confirmed_${orderId}`)
                    .setLabel('✅ Bekräfta Betalning')
                    .setStyle(ButtonStyle.Success)
            );
    } else if (order.paymentMethod.toLowerCase() === 'paypal') {
        const paypalLink = process.env.PAYPAL_LINK || 'https://www.paypal.com/paypalme/babyboidaniel';

        paymentInstructions = `
**💳 PayPal-betalning:**
1. Gå till: ${paypalLink}
2. Skicka betalning
3. **VIKTIGT:** Skriv detta i meddelandet:
   \`${order.name} - ${order.discordUsername}\`
4. Klicka på "✅ Bekräfta Betalning" nedan när du har betalat

⚠️ **Glöm inte att inkludera ditt namn och Discord-användarnamn i PayPal-meddelandet!**`;

        paymentButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`payment_confirmed_${orderId}`)
                    .setLabel('✅ Bekräfta Betalning')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setLabel('💳 Öppna PayPal')
                    .setStyle(ButtonStyle.Link)
                    .setURL(paypalLink)
            );
    }

    // Skicka beställningsdetaljer i tråden
    const orderDetailsEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 Beställningsdetaljer')
        .setDescription(`Hej ${interaction.user}! Här är din beställning:`)
        .addFields(
            { name: '👤 Namn', value: order.name, inline: true },
            { name: '💬 Discord', value: order.discordUsername, inline: true },
            { name: '💳 Betalningsmetod', value: order.paymentMethod, inline: true },
            { name: '🎁 Referral-kod', value: order.referralCode || 'Ingen', inline: true },
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
