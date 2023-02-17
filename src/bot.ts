import { EmbedBuilder } from '@discordjs/builders';
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

// handler for slash commands/interactions
bot.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command: any = bot.commands.get(interaction.commandName);

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription('Error executing command.')], ephemeral: true
        });
    }
});

// on ready event
bot.on(Events.ClientReady, () => {

    // log tag and id
    console.log('logged in as ' + bot.user?.tag + ' (' + bot.user?.id + ')\n');

    // set bot status
    bot.user?.setPresence({
        activities: [{ name: 'Ranked Matchmaking', type: ActivityType.Competing }],
        status: 'online'
    });

});

// login to discord
bot.login(process.env.DISCORD_TOKEN);