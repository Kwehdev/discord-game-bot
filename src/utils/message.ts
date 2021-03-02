import {
  CollectorFilter,
  Message,
  MessageEmbed,
  MessageReaction,
  ReactionEmoji,
  User,
} from 'discord.js'

export const reactionEmojis = {
  deletion: '❌',
  numbers: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
}

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

export const attachMessageReactions = async (
  sentMsg: Message,
  validEmojis: string[]
): Promise<void> => {
  for (const emoji of validEmojis) {
    await sentMsg.react(emoji)
  }
}

export const getValidEmojis = (resultCount: number): string[] =>
  reactionEmojis.numbers.slice(0, resultCount).concat(reactionEmojis.deletion)

export const getAuthorReaction = async (
  sentMsg: Message,
  authorId: string,
  validEmojis: string[]
): Promise<MessageReaction | undefined> => {
  const earlyReaction = checkEarlyReaction(sentMsg, authorId, validEmojis)

  if (earlyReaction) return earlyReaction

  const collection = await sentMsg.awaitReactions(
    reactionFilter(authorId, validEmojis),
    {
      time: 30000,
      max: 1,
    }
  )

  return collection.first()
}

export const reactionFilter = (
  initialAuthorId: string,
  validEmojis: string[]
): CollectorFilter => ({ emoji }: { emoji: ReactionEmoji }, user: User) =>
  user.id === initialAuthorId && validEmojis.includes(emoji.name)

const checkEarlyReaction = (
  sentMsg: Message,
  authorId: string,
  validEmojis: string[]
) =>
  sentMsg.reactions.cache.find(
    ({ users, emoji }) =>
      validEmojis.includes(emoji.name) &&
      !!users.cache.find(({ id }) => id === authorId)
  )
