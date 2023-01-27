import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = {
    data: new SlashCommandBuilder()
        .setName("player")
        .setDescription("Retrieves and displays statistics and information for a specified player")
        .addStringOption((option: any) =>
            option.setName("code")
                .setDescription("The connect code of the desired player")
                .setRequired(true)),

    async execute(interaction: { reply: (arg0: string) => any; }) {
        await interaction.reply("this works");
    },
};
