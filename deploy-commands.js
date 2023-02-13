const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
require('dotenv').config();

// array to hold commands
const commands = [];

// grab command files
const commandsPath = 'dist/src/commands';

const commandFiles = fs.readdirSync(commandsPath)
    .filter((file) => file
        .endsWith('.js'));

// grab SlashCommandBuilder#toJSON() output of each command
for (const file of commandFiles) {
    const command = require(`./${commandsPath}/${file}`);
    commands.push(command.data.toJSON());
}

// refresh all commands
(async () => {
    try {
        console.log(`refreshing ${commands.length} slash commands...`);

        // use REST API to register commands with discord
        const data = await new REST({ version: '10' })
            .setToken(process.env.DISCORD_TOKEN)
            .put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
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