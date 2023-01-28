import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = {
    data: new SlashCommandBuilder()
        .setName("player")
        .setDescription("Fetches player data for a given connect code")
        .addStringOption((option: any) =>
            option.setName("code")
                .setDescription("Slippi connect code of the desired player")
                .setMinLength(3)
                .setMaxLength(8)
                .setRequired(true)),

    async execute(interaction: {
        options: any; reply: (arg0: string) => any;
    }) {

        const code = interaction.options.getString('code');
        await interaction.reply("this works. code: " + code);

    },
};