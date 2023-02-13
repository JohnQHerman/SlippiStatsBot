import { SlashCommandBuilder } from '@discordjs/builders';

import * as admin from "firebase-admin";
import * as firebase from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { Builder, By } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

require('dotenv').config();

// init firebase admin sdk
const serviceAccount = require("../../../slippi-stats-firebase-adminsdk-i04uq-4d22067541.json");

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

const app = firebase.initializeApp(firebaseConfig);
const storage = getStorage(app);

// headless chrome instance
const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new Options().addArguments('--headless'))
    .build();

// build slash command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("player")
        .setDescription("Fetches player data for a given connect code")
        .addStringOption((option: any) =>
            option.setName("code")
                .setDescription("slippi connect code")
                .setMinLength(3)
                .setMaxLength(8) // 3-8 characters
                .setRequired(true)),

    // handle slash command
    async execute(interaction: {
        options: any; reply: (arg0: string) => any;
    }) {

        // validate connect code (contains # followed by digits)
        const connectCode = interaction.options.getString('code');

        if (!connectCode.includes('#') ||
            !/^\d+$/.test(connectCode.slice(connectCode.indexOf('#') + 1))) {
            return interaction.reply("Invalid connect code.");
        }

        // fetch player data
        const user = connectCode.toLowerCase().replace('#', '-');
        driver.get(`https://slippi.gg/user/${user}`);

        // wait for page to load ("Loading" text to disappear)
        await driver.wait(() => {
            return driver.findElement(By.xpath('//div[@role="main"]'))
                .getText()
                .then((text) => {
                    return text !== 'Loading';
                });
        }, 10000);

        // make sure player exists
        let pageSource: string;
        try {
            pageSource = await driver.getPageSource();
        } catch (error) {
            console.log(error);
            return;
        }

        if (pageSource.includes("Player not found")) {
            console.log('player ' + connectCode.toUpperCase() + ' not found');
            return interaction.reply("Player **" + connectCode.toUpperCase() + "** not found.");
        }

        // set window size and zoom to fit stats
        driver.manage().window().setSize(1049, 667);
        driver.executeScript('document.body.style.zoom="86%"');

        // take screenshot and upload to firestore database
        const element = driver.findElement(
            By.xpath('//div[@role="main"]'));

        let screenshot = await element.takeScreenshot();
        let buffer = Buffer.from(screenshot, 'base64');

        const storageRef = ref(storage, `${user}.png`);
        await uploadBytes(storageRef, buffer).then((snapshot) => {
            console.log('uploaded file: ' + snapshot.metadata.fullPath);
        });

        // get download url
        const imageUrl = await getDownloadURL(storageRef);

        // send image
        return interaction.reply(imageUrl);
    },
};