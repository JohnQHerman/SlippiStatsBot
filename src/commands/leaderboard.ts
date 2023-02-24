import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { Builder, By, WebElement } from 'selenium-webdriver';

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
            option.setName("hide-leaderboard")
                .setDescription("Hide leaderboard from other users? | default: false")
                .setRequired(false)),

    // command execution
    async execute(interaction: any) {

        const hideStats: boolean = interaction.options
            .getBoolean('hide-leaderboard') ?? false;

        await interaction.deferReply({ ephemeral: hideStats });

        // init selenium webdriver
        const driver = new Builder()
            .forBrowser('chrome')
            .build();

        // fetch leaderboard page
        const region: string = interaction.options.getString('region');

        try {
            await driver.get(`https://slippi.gg/leaderboards?region=${region}`);
        } catch (error) {
            console.log(error);
            return;
        }

        // take screenshot of leaderboard
        await driver.sleep(1000);
        const element: WebElement = await driver
            .findElement(By.xpath('//*[@id="root"]/div/div/div/div/div/div'));

        await driver.manage().window().setRect({
            width: 1049,
            height: 700
        });

        await driver.executeScript('document.body.style.zoom="80%"');
        await driver.executeScript('window.scrollTo(0, 125)');

        let screenshot: string = await element.takeScreenshot();
        let buffer: Buffer = Buffer.from(screenshot, 'base64');

        // edit deferred reply with leaderboard screenshot
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(0x30912E)
                .setImage(`attachment://${region}.png`)],
            files: [{
                attachment: buffer,
                name: `${region}.png`
            }]
        });

        // close webdriver
        await driver.quit();

    },
};
