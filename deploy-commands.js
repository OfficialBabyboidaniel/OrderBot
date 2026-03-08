const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('beställ')
        .setDescription('Skapa en ny beställning')
        .addStringOption(option =>
            option.setName('namn')
                .setDescription('Ditt namn eller alias')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('discord-username')
                .setDescription('Ditt Discord-användarnamn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('betalningsmetod')
                .setDescription('Betalningsmetod')
                .setRequired(true)
                .addChoices(
                    { name: 'Swish', value: 'Swish' },
                    { name: 'PayPal', value: 'PayPal' }
                ))
        .addStringOption(option =>
            option.setName('referral-kod')
                .setDescription('Referral-kod (valfritt)')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('hjälp')
        .setDescription('Visa hjälpinformation för beställningsboten')
].map(command => command.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Började uppdatera applikations (/) kommandon.');

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands },
        );

        console.log('Lyckades ladda om applikations (/) kommandon.');
    } catch (error) {
        console.error(error);
    }
})();