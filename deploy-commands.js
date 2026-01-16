const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('order')
        .setDescription('Create a new game order')
        .addStringOption(option =>
            option.setName('game-name')
                .setDescription('Name of the game')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('price')
                .setDescription('Current price of the game (EUR/£)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('steam-name')
                .setDescription('Your Steam username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('payment-method')
                .setDescription('Payment method')
                .setRequired(true)
                .addChoices(
                    { name: 'PayPal', value: 'PayPal' },
                    { name: 'Swish', value: 'Swish' }
                )),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help information for the order bot')
].map(command => command.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();