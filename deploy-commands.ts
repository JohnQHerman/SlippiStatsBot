import { REST, Routes } from 'discord.js';
const fs = require('fs');
require('dotenv').config();

// array to hold commands
const commands: Array<any> = [];

// grab command files
const commandsPath: string = 'dist/commands';

const commandFiles: string[] = fs.readdirSync(commandsPath)
    .filter((file: string): boolean => file
        .endsWith('.js'));

// grab SlashCommandBuilder#toJSON() output of each command
for (const file of commandFiles) {
    const command = require(`./${commandsPath}/${file}`);
    commands.push(command.data.toJSON());
}

// refresh all commands (global)
(async (): Promise<void> => {
    try {
        console.log(`refreshing ${commands.length} slash commands...`);

        // register commands with discord
        const data: any = await new REST({ version: '10' })
            .setToken(process.env.DISCORD_TOKEN!)
            .put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
                { body: commands },
            );

        console.log(`refreshed ${data.length} slash commands (${commands.length > 0 ? commands
            .map((command: any) => command.name)
            .sort((a: string, b: string) => b.localeCompare(a))
            .join(', ') : 'none'})`);

    } catch (error) {
        console.error(error);
    }
})();