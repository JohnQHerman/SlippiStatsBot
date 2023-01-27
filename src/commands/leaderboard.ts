import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Retrieves and displays leaderboards for a given region")
        .addStringOption((option: any) =>
            option.setName("region")
                .setDescription("Desired region to fetch leaderboards for")),

    async execute(interaction: { reply: (arg0: string) => any; }) {
        await interaction.reply("this works");
    },
};
