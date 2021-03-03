import { Message } from 'discord.js'

export default function handleHelpCommand(msg: Message): Promise<Message> {
  return msg.reply(
    `Current commands and their usage as follows.
\`\`\`?help - Displays a list of commands and their usage.

?steam 'searchterm' - Will display the first 10 results (or fewer) found by parsing the steam store. These results may be filtered by the user who typed the command by reacting to the comment, or deleted if no matches are found.\`\`\`
`
  )
}
