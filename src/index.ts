import { Client, Message } from 'discord.js'

const client = new Client()
const COMMAND_PREFIX = '?'

client.on('ready', () => {
  if (client.user) {
    console.log(`${new Date()}: Logged in as ${client.user.tag}`)
  }
})

client.on('message', (msg: Message) => {
  // Return if MSG is not a command, or if author is bot.
  if (!msg.content.startsWith(COMMAND_PREFIX) || msg.author.bot) return

  const [command, ...args] = msg.content.slice(COMMAND_PREFIX.length).split(' ')

  switch (command.toLowerCase()) {
    default:
      return msg.channel.send('Unknown command.')
  }
})

client.login(process.env.DISCORD_TOKEN)
