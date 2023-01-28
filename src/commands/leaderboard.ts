import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Retrieves and displays leaderboards for a given region")
        .addStringOption((option: any) =>
            option.setName("region")
                .setDescription("Desired region to fetch leaderboards for")
                .addChoices(
                    { name: "North America", value: "na" },
                    { name: "Europe", value: "eu" },
                    { name: "Other", value: "au" },
                )
                .setRequired(true)),

    async execute(interaction: {
        options: any; reply: (arg0: string) => any;
    }) {

        const region = interaction.options.getString('region');
        await interaction.reply("this works. region selected: " + region);

    },
};
