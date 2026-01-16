const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('beställ')
        .setDescription('Skapa en ny spelbeställning')
        .addStringOption(option =>
            option.setName('spelnamn')
                .setDescription('Namn på spelet')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pris')
                .setDescription('Nuvarande pris på spelet i EUR (t.ex. 59.99)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('steam-namn')
                .setDescription('Ditt Steam användarnamn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('betalningsmetod')
                .setDescription('Betalningsmetod')
                .setRequired(true)
                .addChoices(
                    { name: 'PayPal', value: 'PayPal' },
                    { name: 'Swish', value: 'Swish' }
                )),
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