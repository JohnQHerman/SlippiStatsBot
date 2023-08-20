# 🐸 Slippi Stats Discord Bot

A convenient tool for retrieving and displaying player info from Slippi.gg in your Discord server.

This bot utilizes Discord.js's slash command feature for command input and Puppeteer to scrape Slippi.gg.

![image](https://user-images.githubusercontent.com/95893344/221094789-cc47df3b-da51-48df-98db-2eeefd1fb34f.png)

## 🚀 Usage

A public instance of this bot, hosted on my own hardware, can be invited to your server by clicking [here](https://discord.com/api/oauth2/authorize?client_id=881000000000000000&permissions=2048&scope=applications.commands%20bot).

For those who prefer hosting their own instance of the bot, follow these instructions:

1. Clone this repository to your local machine.
2. Run `npm install` to install the required dependencies.
3. Create a Discord bot and invite it to your server.
4. Add your bot token to the `.env` file as `DISCORD_TOKEN`.
5. Run `tsc ./deploy-commands.ts && node ./deploy-commands.js` to deploy the bot's slash commands.
6. Launch the bot by running `npm start`.

## 🎮 Commands

### `/player`

Retrieves player data based on a specified connect code.

Options:

- `code`: The Slippi connect code for the player.
- `hide-reply`: Optional. Conceals stats from other users. Default: `false`.

## 🙌 Credits

This project was developed by John Q. Herman under the [MIT](https://choosealicense.com/licenses/mit/) license.
