import { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders';

import * as admin from "firebase-admin";
import * as firebase from "firebase/app";
import { FirebaseStorage, getDownloadURL, getStorage, ref, StorageReference, uploadBytes } from "firebase/storage";

import { Builder, By, ThenableWebDriver, WebElement } from 'selenium-webdriver';

require('dotenv').config();

// init firebase admin sdk
const serviceAccount = require("../../service_account.json");

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const storage: FirebaseStorage = getStorage(firebase
    .initializeApp(firebaseConfig));

// init selenium webdriver
const driver: ThenableWebDriver = new Builder()
    .forBrowser('chrome')
    .build();

// export command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("player")
        .setDescription("Fetches player data for a given connect code.")
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName("code")
                .setDescription("Slippi connect code")
                .setMinLength(3)
                .setMaxLength(8) // 3-8 characters
                .setRequired(true)),

    // execute command
    async execute(interaction: {
        deferReply: () => Promise<void>;
        editReply(arg0: { embeds: EmbedBuilder[]; ephemeral?: boolean | undefined; }): Promise<void>;
        user: {
            username: string; discriminator: number;
        };
        options: { getString: (arg0: string) => string; };
        reply: (arg0: any) => Promise<void>;
    }) {

        // defer reply to avoid timeout
        await interaction.deferReply();

        // validate connect code (contains '#' followed by only digits)
        let connectCode: string = interaction.options.getString('code');

        if (!connectCode.includes('#') ||
            !/^\d+$/.test(connectCode.slice(connectCode.indexOf('#') + 1))) {
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
        } catch (error: any) {
            console.log(error);
            return;
        }

        let pageSource: string = await driver.getPageSource();

        // wait for page to load
        while (pageSource.includes("Loading")) {
            try {
                pageSource = await driver.getPageSource();
            } catch (error: any) {
                console.log(error);
                return;
            }
        }

        // make sure player exists
        if (pageSource.includes("Player not found")) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("Player **" + connectCode.toUpperCase() + "** not found.")]
            });
        }

        // take screenshot, upload to firebase storage, and get download url
        const element: WebElement = await driver.findElement(
            By.xpath('//div[@role="main"]'));

        let screenshot: string = await element.takeScreenshot();
        let buffer: Buffer = Buffer.from(screenshot, 'base64');

        const storageRef: StorageReference = ref(storage, `players/${user}.png`);

        await uploadBytes(storageRef, buffer, { contentType: 'image/png' })
            .then((snapshot) => {

                let timestamp: string = new Date().toLocaleString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });

                console.log(timestamp + " | " + interaction.user.username +
                    "#" + interaction.user.discriminator +
                    ' | ' + snapshot.metadata.fullPath +
                    ' | ' + (snapshot.metadata.size / 1024)
                        .toFixed(2) + ' KB');
            });

        let imageUrl: string = await getDownloadURL(storageRef);

        // edit deferred reply with player data
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(0x30912E)
                .setImage(imageUrl)]
        });
    },
};