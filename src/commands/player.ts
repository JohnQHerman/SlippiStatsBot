import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders';

import * as admin from "firebase-admin";
import * as firebase from "firebase/app";
import { FirebaseStorage, getDownloadURL, getStorage, ref, StorageReference, uploadBytes } from "firebase/storage";

const serviceAccount = require("../../service_account.json") as admin.ServiceAccount;

import { Builder, By, ThenableWebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

require('dotenv').config();

// init firebase admin sdk
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

const app: firebase.FirebaseApp = firebase.initializeApp(firebaseConfig);
const storage: FirebaseStorage = getStorage(app);

// headless chrome instance
const driver: ThenableWebDriver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new Options().addArguments('--headless'))
    .build();

// build slash command
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

    // handle slash command
    async execute(interaction: {
        user: { username: string; };
        options: { getString: (arg0: string) => string; };
        reply: (arg0: string) => Promise<void>;
    }) {

        // validate connect code (contains # followed by digits)
        const connectCode: string = interaction.options.getString('code');

        if (!connectCode.includes('#') ||
            !/^\d+$/.test(connectCode.slice(connectCode.indexOf('#') + 1))) {
            return interaction.reply("Invalid connect code.");
        }

        // fetch player data
        let user: string = connectCode.toLowerCase().replace('#', '-');
        driver.get(`https://slippi.gg/user/${user}`);
        await driver.sleep(1000);

        // make sure player exists
        let pageSource: string;
        try {
            pageSource = await driver.getPageSource();
        } catch (error) {
            console.log(error);
            return;
        }

        if (pageSource.includes("Player not found")) {
            console.log('player ' + connectCode.toUpperCase() + ' not found (searched by ' + interaction.user.username + ')');
            return interaction.reply("Player **" + connectCode.toUpperCase() + "** not found.");
        }

        // set window size and zoom to fit stats
        driver.manage().window().setSize(1049, 667);
        driver.executeScript('document.body.style.zoom="86%"');

        // take screenshot and upload to firestore database
        const element: WebElement = await driver.findElement(
            By.xpath('//div[@role="main"]'));

        let screenshot: string = await element.takeScreenshot(true);
        let buffer: Buffer = Buffer.from(screenshot, 'base64');

        const storageRef: StorageReference = ref(storage, `${user}.png`);
        await uploadBytes(storageRef, buffer).then((snapshot) => {
            console.log('uploaded file: ' + snapshot.metadata.fullPath);
        });

        // get download url
        const imageUrl: string = await getDownloadURL(storageRef);

        // send image
        return interaction.reply(imageUrl);
    },
};