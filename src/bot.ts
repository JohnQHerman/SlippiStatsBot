import Discord, { ActivityType, Collection, Events, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

require('dotenv').config();

// extend Client class to add commands property
class bruhClient extends Discord.Client {
    commands: Discord.Collection<string, any>;
    constructor(options: Discord.ClientOptions) {
        super(options);
        this.commands = new Collection();
    }
}

// new extended client instance
const bot: bruhClient = new bruhClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

// read commands folder and add commands to client.commands collection
const commandsPath: string = path.join(__dirname, 'commands');
const commandFiles: string[] = fs.readdirSync(commandsPath)
    .filter((file: string) => file
        .endsWith('.js'));

// loop through command files
for (const file of commandFiles) {
    const filePath: string = path.join(commandsPath, file);
    const command: any = require(filePath);

    // set command to client.commands collection if it has data and execute properties
    if ('data' in command && 'execute' in command) {
        bot.commands.set(command.data.name, command);
    } else {
        console.log(`command ${filePath} missing required data or execute property`);
    }
}

// handler for slash commands and buttons and stuff idk i havent gotten that far yet lol
bot.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command: any = bot.commands.get(interaction.commandName);

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply(
            { content: 'Error executing command.', ephemeral: true }
        );
    }
});

// on ready event
bot.on(Events.ClientReady, () => {

    // log bot tag and id
    console.log('logged in as ' + bot.user?.tag + ' (' + bot.user?.id + ')');

    // set bot status
    bot.user?.setPresence({
        activities: [{ name: 'Ranked Matchmaking', type: ActivityType.Competing }],
        status: 'online'
    });

    // log commands (reverse sorted)
    console.log('commands: ' + bot.commands.size
        + ' (' + (bot.commands.size > 0 ? bot.commands
            .map((command: any) => command.data.name)
            .sort((a: string, b: string) => b.localeCompare(a))
            .join(', ') : 'none') + ') \n');
});

// login to discord
bot.login(process.env.DISCORD_TOKEN);