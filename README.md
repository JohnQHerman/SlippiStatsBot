# Slippi Stats Discord bot

A Discord bot that Retrieves and displays player information and leaderboards from Slippi.gg.

Uses Discord's slash command feature to handle command input.

I personally host this bot (invite link Soon™), but if you want to host it yourself, you can follow the instructions below.

### Installation

1. Clone this repository to your local machine.
2. Install dependencies by running `npm install`.

### Usage

1. Create a Discord bot and invite it to your server.
2. Add your bot token to the `.env` file.
3. Start the bot by running `npm start`.
4. Use the `/player` command to retrieve player data, or use the `/leaderboard` command to retrieve the leaderboards for a given region.

## Commands

### `/player`

Fetches player data for a given connect code.

Options:

- `code`: The Slippi connect code for the player.
- `hide-stats`: Optional. Hide stats from other users. Default: `false`.

### `/leaderboard`

Fetches the top players for a given region.

Options:

- `region`: The region to fetch the leaderboard for. (North America, Europe, Other)
- `hide-leaderboard`: Optional. Hide leaderboard from other users. Default: `false`.

## Credits

This project was created by John Q. Herman [(sharkobarko)](https://slippi.gg/user/srko-117)

## License

[MIT](https://choosealicense.com/licenses/mit/)
