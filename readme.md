# Discord Game Bot

A Discord bot to assist users with finding various information about different games, in an easy to use readable format.

## Supports

`?steam` Parses the Steam store to find the Application ID of query, then utilizes the ISteamApps official API to retrieve additional data.

More to come...

## Usage

`?steam 'searchterm'` Will display the first 10 results (or fewer) found by parsing the steam store. These results may be filtered by the user who typed the command by reacting to the comment, or deleted if no matches are found.

## Demo

![GIF Demonstration](/Demo.gif)

## Cloning

    git clone https://github.com/kwehdev/discord-game-bot/

    cd discord-game-bot

    cp .env.example .env & enter token/clientID

    yarn install # or npm install
