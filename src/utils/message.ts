import { Message, MessageEmbed } from 'discord.js'

export const responseWithDeletion = async (
  msg: Message,
  content: string,
  timeout: number
): Promise<Message> => {
  const sentMsg = await msg.reply(content)
  return sentMsg.delete({
    timeout,
  })
}

type CreateMessageEmbedArgs = {
  title: string
  description?: unknown
  url: string
}

export const createMessageEmbed = ({
  title,
  description,
  url,
}: CreateMessageEmbedArgs): MessageEmbed => {
  const messageEmbed = new MessageEmbed()
    .setAuthor('Discord Game Bot')
    .setTitle(title)
    .setURL(url)
  description && messageEmbed.setDescription(description)
  return messageEmbed
}
