const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('erm')
        .setDescription('replies with erm!!!'),

    async execute(interaction: { reply: (arg0: string) => any; }) {
        await interaction.reply("erm!!!!");
    },
};
