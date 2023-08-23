import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { Factory, Options, Pool, createPool } from 'generic-pool';
import puppeteer, { Browser, Page } from 'puppeteer';

// types for slash command
interface Interaction {
    options: {
        getString(optionName: string): string;
        getBoolean(optionName: string): boolean | null;
    };

    deferReply(options: { ephemeral: boolean }): Promise<void>;
    editReply(options: EditReplyOptions): Promise<void>;
}

interface EditReplyOptions {
    embeds?: EmbedBuilder[];
    files?: { attachment: Buffer; name: string }[];
}

// constants
const PLAYER_NOT_FOUND_TEXT = "Player not found";
const VIEWPORT_SIZE = { width: 1249, height: 1247 };
const HEADLESS_BROWSER_CONFIG = {
    headless: "new" as any,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
    ],
    timeout: 60 * 1000 // 60 seconds
};

// browser pool
const browserFactory: Factory<Browser> = {
    create: (): Promise<Browser> => puppeteer.launch(HEADLESS_BROWSER_CONFIG),
    destroy: (browser: Browser): Promise<void> => browser.close()
};

const poolOptions: Options = { min: 2, max: 10 };
const browserPool: Pool<Browser> = createPool<Browser>(browserFactory, poolOptions);

// command class
class PlayerCommand {
    data = new SlashCommandBuilder()
        .setName("player")
        .setDescription("Fetches player data for a given connect code.")
        .addStringOption(option =>
            option.setName("code")
                .setDescription("Slippi connect code")
                .setMinLength(3)
                .setMaxLength(8) // 3-8 characters
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName("hide-reply")
                .setDescription("Hide bot reply from other users? | default: false")
                .setRequired(false));

    // command handler
    async execute(interaction: Interaction) {
        try {
            // defer reply and handle hide-reply option
            const hideReply: boolean = interaction.options.getBoolean('hide-reply') ?? false;
            await interaction.deferReply({ ephemeral: hideReply });

            // handle invalid connect codes
            const connectCode: string = interaction.options.getString('code');
            if (!this.isValidConnectCode(connectCode)) {
                return this.replyWithError(interaction, "Invalid connect code.");
            }

            // fetch player page and handle invalid players
            const user = this.formatUser(connectCode);
            const browser: Browser = await browserPool.acquire();

            try {
                const { page, pageSource } = await this.fetchPlayerPage(user, browser);

                if (this.playerNotFound(pageSource)) {
                    await page.close();
                    return this.replyWithError(interaction, `Player **${connectCode.toUpperCase()}** not found.`);
                }

                // take screenshot and reply with player data
                const screenshot: Buffer = await this.takeScreenshot(page);
                await this.replyWithPlayerData(interaction, user, screenshot);
                await page.close();

            } finally {
                // release browser back to pool
                await browserPool.release(browser);
            }

        } catch (error) { // handle errors
            console.error(error);
            await this.replyWithError(interaction, "An error occurred while fetching player data.");
        }
    }

    // connect code helpers
    isValidConnectCode(connectCode: string): boolean {
        return connectCode.includes('#') &&
            /^\d+$/.test(connectCode
                .slice(connectCode.indexOf('#') + 1));
    }

    formatUser(connectCode: string): string {
        return connectCode.toLowerCase().replace('#', '-');
    }

    // browser helpers
    async fetchPlayerPage(user: string, browser: Browser): Promise<{ page: Page, pageSource: string }> {
        const page = await browser.newPage();
        await page.setViewport(VIEWPORT_SIZE);
        await page.goto(`https://slippi.gg/user/${user}`, { waitUntil: 'networkidle0' });
        await page.waitForSelector('body');

        const pageSource = await page.content();
        return { page, pageSource };
    }

    playerNotFound(pageSource: string): boolean {
        return pageSource.includes(PLAYER_NOT_FOUND_TEXT);
    }

    async takeScreenshot(page: Page): Promise<Buffer> {
        const element = await page.$('div[role="main"]');

        if (!element) {
            throw new Error("Element not found.");
        }

        const screenshot: Buffer = await element.screenshot() as Buffer;
        return screenshot;
    }

    // reply helpers
    async replyWithError(interaction: Interaction, message: string) {
        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(message)],
        });
    }

    async replyWithPlayerData(interaction: Interaction, user: string, screenshot: Buffer) {
        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(0x30912E).setImage(`attachment://${user}.png`)],
            files: [{ attachment: screenshot, name: `${user}.png` }],
        });
    }
}

export default PlayerCommand;
