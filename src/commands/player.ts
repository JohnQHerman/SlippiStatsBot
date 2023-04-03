import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import puppeteer from 'puppeteer';

// export command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("player")
        .setDescription("Fetches player data for a given connect code.")
        .addStringOption((option) =>
            option.setName("code")
                .setDescription("Slippi connect code")
                .setMinLength(3)
                .setMaxLength(8) // 3-8 characters
                .setRequired(true))
        .addBooleanOption((option) =>
            option.setName("hide-reply")
                .setDescription("Hide reply from other users? | default: false")
                .setRequired(false)),

    // command execution
    async execute(interaction: any) {

        try {
            const hideStats: boolean = interaction.options
                .getBoolean('hide-reply') ?? false;

            await interaction.deferReply({ ephemeral: hideStats });

            // validate connect code
            const connectCode: string = interaction.options.getString('code');

            if (!connectCode.includes('#')
                || !/^\d+$/.test(connectCode.slice(connectCode.indexOf('#') + 1))) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription("Invalid connect code.")]
                });
            }

            // init puppeteer browser
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            // fetch player page
            let user: string;

            try {
                user = connectCode.toLowerCase().replace('#', '-');
                await page.goto(`https://slippi.gg/user/${user}`);
            } catch (error) {
                console.log(error);
                return;
            }

            // wait for player data & images to load
            let pageSource: string = await page.content();

            while (pageSource.includes("Loading") && !pageSource.includes("Player not found")) {
                try {
                    pageSource = await page.content();
                } catch (error: any) {
                    console.log(error);
                    return;
                }
            }

            // check if player exists
            await new Promise(r => setTimeout(r, 1000));
            if (pageSource.includes("Player not found")) {
                await browser.close();
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription("Player **" + connectCode.toUpperCase() + "** not found.")]
                });
            }

            // take screenshot of player data
            const element = await page.$('div[role="main"]');

            if (!element) {
                console.log('element not found');
                return;
            }

            await page.setViewport({
                width: 1249,
                height: 1247
            });

            let screenshot: Buffer = await element.screenshot() as Buffer;

            // edit deferred reply with player data screenshot
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0x30912E)
                    .setImage(`attachment://${user}.png`)],
                files: [{
                    attachment: screenshot,
                    name: `${user}.png`
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
                    .setDescription("An error occurred while fetching player data.")]
            });
        }
    },
};
