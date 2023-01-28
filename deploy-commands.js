const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
require('dotenv').config();

// env variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// array to hold commands
const commands = [];

// grab command files from ./dist/commands
const commandFiles = fs.readdirSync('./dist/commands').filter((file) => file.endsWith('.js'));

// grab the SlashCommandBuilder#toJSON() output of each command's data
for (const file of commandFiles) {
    const command = require(`./dist/commands/${file}`);
    commands.push(command.data.toJSON());
}

// refresh all commands
(async () => {
    try {
        console.log(`refreshing ${commands.length} slash commands...`);

        // use REST API to register commands with discord
        const data = await new REST({ version: '10' })
            .setToken(token)
            .put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );

        console.log(`successfully reloaded ${data.length} slash commands.`);

    } catch (error) {
        console.error(error);
    }

    console.log('commands: ' + commands.length
        + ' (' + (commands.length > 0 ? commands
            .map(command => command.name)
            .join(', ') : 'none') + ')');
})();