import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { Builder, By, WebElement } from 'selenium-webdriver';

require('dotenv').config();

// init selenium webdriver
const driver = new Builder()
    .forBrowser('chrome')
    .build();

driver.manage()
    .window()
    .setRect({
        width: 1249,
        height: 1247
    });

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
            option.setName("hide-stats")
                .setDescription("Hide stats from other users? | default: false")
                .setRequired(false)),

    // execute command
    async execute(interaction: any) {

        const hideStats: boolean = interaction.options
            .getBoolean('hide-stats') ?? false;

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

        // fetch player page
        let user: string;

        try {
            user = connectCode.toLowerCase().replace('#', '-');
            await driver.get(`https://slippi.gg/user/${user}`);
        } catch (error) {
            console.log(error);
            return;
        }

        // wait for player data & images to load
        let pageSource: string = await driver.getPageSource();

        while (pageSource.includes("Loading") && !pageSource.includes("Player not found")) {
            try {
                pageSource = await driver.getPageSource();
            } catch (error: any) {
                console.log(error);
                return;
            }
        }

        // check if player exists
        await driver.sleep(750);

        if (pageSource.includes("Player not found")) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("Player **" + connectCode.toUpperCase() + "** not found.")]
            });
        }

        // take screenshot of player data
        const element: WebElement = await driver.findElement(By.xpath('//div[@role="main"]'));

        let screenshot: string = await element.takeScreenshot();
        let buffer: Buffer = Buffer.from(screenshot, 'base64');

        // edit deferred reply with screenshot
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(0x30912E)
                .setImage(`attachment://${user}.png`)],
            files: [{
                attachment: buffer,
                name: `${user}.png`
            }]
        });
    },
};