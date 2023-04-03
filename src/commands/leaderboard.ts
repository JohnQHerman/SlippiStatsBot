import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import puppeteer from 'puppeteer';

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
                    { name: "Other", value: "other" },
                )
                .setRequired(true))
        .addBooleanOption((option: any) =>
            option.setName("hide-reply")
                .setDescription("Hide reply from other users? | default: false")
                .setRequired(false)),

    // command execution
    async execute(interaction: any) {

        const hideStats: boolean = interaction.options
            .getBoolean('hide-reply') ?? false;

        await interaction.deferReply({ ephemeral: hideStats });

        try {
            // init puppeteer browser
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            // fetch leaderboard page
            const region: string = interaction.options.getString('region');

            await page.goto(`https://slippi.gg/leaderboards?region=${region}`);

            // take screenshot of leaderboard
            const element = await page.$('#root > div > div > div > div > div > div');

            if (!element) {
                console.log('element not found');
                return;
            }

            await page.setViewport({
                width: 1049,
                height: 700
            });

            await page.evaluate(() => {
                document.body.style.transform = 'scale(0.8)';
                window.scrollTo(0, 125);
            });

            let screenshot: Buffer = await element.screenshot() as Buffer;

            // edit deferred reply with leaderboard screenshot
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0x30912E)
                    .setImage(`attachment://${region}.png`)],
                files: [{
                    attachment: screenshot,
                    name: `${region}.png`
                }]
            });

            // close browser
            await browser.close();

            // error handling
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("An error occurred while fetching the leaderboard.")]
            });
        }
    },
};
