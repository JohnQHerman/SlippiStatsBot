import { EmbedBuilder } from '@discordjs/builders';
import Discord, {
    ActivityType,
    Collection,
    CommandInteraction,
    Events,
    GatewayIntentBits,
} from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

require('dotenv').config();

// interface for command object
interface Command {
    data: {
        name: string;
        description: string;
        options?: Array<{
            name: string;
            description: string;
            type: number;
            required: boolean
        }>;
    };
    execute: (interaction: CommandInteraction) => Promise<void>;
}

// extend Client class to add commands property (bruh)
class BruhClient extends Discord.Client {
    commands: Collection<string, Command>;

    constructor(options: Discord.ClientOptions) {
        super(options);
        this.commands = new Collection();
    }
}

// new extended client instance
const bot: BruhClient = new BruhClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// read commands folder and add commands to client.commands collection
const commandsPath: string = path.join(__dirname, 'commands');
const commandFiles: string[] = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith('.js'));

// loop through command files
for (const file of commandFiles) {
    const filePath: string = path.join(commandsPath, file);
    const CommandClass = require(filePath).default;
    const command: Command = new CommandClass();

    // check if command has required data and execute properties, then add to collection
    if ('data' in command && 'execute' in command) {
        bot.commands.set(command.data.name, command);
    } else {
        console.log(`command ${filePath} missing required data or execute property`);
    }
}

// handler for interactionCreate event
bot.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    console.log(
        `received /${interaction.commandName} command from ${interaction.user.tag} in ${interaction.guild?.name}`,
    );

    // get command from collection and execute
    const command: Command | undefined = bot.commands.get(interaction.commandName);

    try {
        await command?.execute(interaction);
        console.log(`${interaction.ephemeral ? 'ephemeral ' : ''}reply sent to ${interaction.user.tag} in ${interaction.guild?.name}`);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription('Error executing command.'),
            ],
            ephemeral: true,
        });
    }
});

// on ready event
bot.on(Events.ClientReady, () => {
    console.log(`logged in as ${bot.user?.tag} (${bot.user?.id})`);
    bot.user?.setActivity("Slippi Ranked", { type: ActivityType.Playing });
});

// global error handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// log in to discord
bot.login(process.env.DISCORD_TOKEN);