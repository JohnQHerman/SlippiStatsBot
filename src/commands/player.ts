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
        .setDescription("Fetches player data for a given connect code")
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName("code")
                .setDescription("slippi connect code")
                .setMinLength(3)
                .setMaxLength(8) // 3-8 characters
                .setRequired(true)),

    // execute command
    async execute(interaction: {
        deferReply: () => Promise<void>;
        editReply(arg0: { embeds: EmbedBuilder[]; ephemeral?: boolean | undefined; }): Promise<void>;
        user: { username: string; };
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

        // fetch player data
        let user: string;

        try {
            user = connectCode.toLowerCase().replace('#', '-');
            await driver.get(`https://slippi.gg/user/${user}`);
        } catch (error: any) {
            console.log(error);
            return;
        }

        await driver.sleep(1500); // wait for page to load

        // make sure player exists
        let pageSource: string;

        try {
            pageSource = await driver.getPageSource();
        } catch (error: any) {
            console.log(error);
            return;
        }

        if (pageSource.includes("Player not found")) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("Player **" + connectCode.toUpperCase() + "** not found.")]
            });
        }

        // take screenshot and upload to firebase storage
        const element: WebElement = await driver.findElement(
            By.xpath('//div[@role="main"]'));

        let screenshot: string = await element.takeScreenshot();
        let buffer: Buffer = Buffer.from(screenshot, 'base64');

        const storageRef: StorageReference = ref(storage, `players/${user}.png`);
        await uploadBytes(storageRef, buffer).then((snapshot) => {
            console.log(interaction.user.username + ' uploaded ' +
                snapshot.metadata.fullPath + ' (' +
                snapshot.metadata.size + ' bytes)');
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