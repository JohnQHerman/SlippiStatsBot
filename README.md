# Slippi Stats Discord bot

A Discord bot that Retrieves and displays player information and leaderboards from Slippi.gg.

Uses Discord's slash command feature to handle command input.

![image](https://user-images.githubusercontent.com/95893344/221094789-cc47df3b-da51-48df-98db-2eeefd1fb34f.png)

## Usage

I host a public instance of this bot on my own hardware, which you can invite to your server by clicking [here](https://discord.com/api/oauth2/authorize?client_id=881000000000000000&permissions=2048&scope=applications.commands%20bot).

If you'd like to host your own instance of the bot, follow the instructions below.

1. Clone this repository to your local machine.
2. Install dependencies by running `npm install`.
3. Create a Discord bot and invite it to your server.
4. Add your bot token to the `.env` file.
5. Start the bot by running `npm start`.

## Commands

### `/player`

Fetches player data for a given connect code.

Options:

- `code`: The Slippi connect code for the player.
- `hide-stats`: Optional. Hide stats from other users. Default: `false`.

### `/leaderboard`

Fetches the top players for a given region. (WIP, needs region buttons and pagination)

Options:

- `region`: The region to fetch the leaderboard for. (North America, Europe, Other)
- `hide-leaderboard`: Optional. Hide leaderboard from other users. Default: `false`.

## Credits

This project was created by John Q. Herman [(sharkobarko)](https://twitter.com/sharkobarko)

## License

[MIT](https://choosealicense.com/licenses/mit/)
