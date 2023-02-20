import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';

import * as admin from "firebase-admin";
import * as firebase from "firebase/app";
import { getDownloadURL, getStorage, ref, StorageReference, uploadBytes } from "firebase/storage";

import { Builder, By, WebElement } from 'selenium-webdriver';

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

const storage = getStorage(
    firebase.initializeApp(firebaseConfig));

// init selenium webdriver
const driver = new Builder()
    .forBrowser('chrome')
    .build();

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
            option.setName("private")
                .setDescription("Whether or not to hide stats from others")
                .setRequired(false)),

    // execute command
    async execute(interaction: any) {

        const Private: boolean = interaction.options
            .getBoolean('private') ?? false;

        await interaction.deferReply({ ephemeral: Private });

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
        let pageSource: string;

        try {
            pageSource = await driver.getPageSource();
            while (!pageSource.includes(`src="/static/media/rank_`)) {
                try {
                    pageSource = await driver.getPageSource();
                } catch (error) {
                    console.log(error);
                    return;
                }
            }
        } catch (error) {
            console.log(error);
            return;
        }

        // check if player exists
        if (pageSource.includes("Player not found")) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("Player **" + connectCode.toUpperCase() + "** not found.")]
            });
        }

        // take screenshot of player data
        const element: WebElement = await driver.findElement(
            By.xpath('//div[@role="main"]'));

        const screenshot: string = await element.takeScreenshot();
        const buffer: Buffer = Buffer.from(screenshot, 'base64');
        const storageRef: StorageReference = ref(storage, `players/${user}.png`);

        let fileExists: boolean = true;
        try {
            await getDownloadURL(storageRef);
        } catch (error) {
            fileExists = false;
        }

        // upload screenshot to firebase storage
        await uploadBytes(storageRef, buffer, {
            contentType: 'image/png',
            cacheControl: 'public, max-age=21600'
        }).then((snapshot) => {
            console.log(
                new Date().toLocaleString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }) + " | " + interaction.user.username + "#" + interaction.user.discriminator
                + (fileExists ? ' replaced ' : ' uploaded ')
                + (snapshot.metadata.size / 1024).toFixed(2) + " KB"
                + (fileExists ? ' at ' : ' to ') + snapshot.metadata.fullPath);
        })

        // edit deferred reply with player data embed
        let imageUrl: string = await getDownloadURL(storageRef);
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(0x30912E)
                .setImage(imageUrl)]
        });
    },
};