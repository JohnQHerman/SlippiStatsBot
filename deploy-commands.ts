import { REST, Routes } from 'discord.js';
import * as fs from 'fs';
require('dotenv').config();

// get all command files
const commands: Array<any> = [];
const commandsPath: string = 'dist/commands';
const commandFiles: string[] = fs
    .readdirSync(commandsPath)
    .filter((file: string): boolean => file.endsWith('.js'));

// get SlashCommandBuilder#toJSON() output of each command
for (const file of commandFiles) {
    const command = require(`./${commandsPath}/${file}`);
    commands.push(command.data.toJSON());
}

// refresh all commands
(async (): Promise<void> => {
    try {
        console.log(`refreshing ${commands.length} slash commands...`);

        // register commands with discord
        const data: any = await new REST({ version: '10' })
            .setToken(process.env.DISCORD_TOKEN!)
            .put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
                body: commands,
            });

        // log number of commands refreshed
        console.log(
            `refreshed ${data.length} slash command${data.length === 1 ? '' : 's'
            }.`
        );
    } catch (error) {
        console.error(error);
    }
})();
