import { Message, MessageEmbed, MessageReaction } from 'discord.js'
import DOMParser from 'dom-parser'
import {
  getRawHTML,
  handleSteamAPIRequest,
  SteamAppData,
} from '../../utils/data'
import {
  attachMessageReactions,
  createMessageEmbed,
  getAuthorReaction,
  getValidEmojis,
  reactionEmojis,
  responseWithDeletion,
} from '../../utils/message'
import { QueryResult } from './types'

export default async function handleSteamCommand(
  msg: Message,
  query: string[]
): Promise<Message> {
  // Handle incorrect syntax or help command.
  if (query.length === 0) {
    return msg.channel.send('Invalid use of command. Try ?steam --help')
  }

  // To be implemented
  if (query[0] === '--help') {
    return msg.channel.send('Currently not supported')
  }

  const { results, isEmpty } = await parseSteam(query)

  // Alert the user that no results were found, delete the message after 30 seconds.
  if (isEmpty) {
    return responseWithDeletion(
      msg,
      `I could not find any games matching ${query}.\nAutomatically removing this message after 30 seconds.`,
      30000
    )
  }

  const resultEmbedList = createSteamListMessageEmbed(query, results)

  const sentMsg = await msg.channel.send(resultEmbedList)

  const authorReaction = await getUserReaction(sentMsg, msg.author.id, results)

  // If the author didn't react within 30 seconds, or selected the delete emoji, return & delete the message.
  if (!authorReaction || authorReaction.emoji.name === reactionEmojis.deletion)
    return sentMsg.delete()

  const chosenEmojiIndex = reactionEmojis.numbers.findIndex(
    (emoji) => emoji === authorReaction.emoji.name
  )

  const chosenResult = results[chosenEmojiIndex]

  const steamApplicationData = await handleSteamAPIRequest(chosenResult)

  // Delete the message no matter what at this point, to reduce spam.
  await sentMsg.delete()

  if (!steamApplicationData)
    return msg.reply(
      `${Date.now()}: Error retreiving data from Steam API. Please submit a bug report.`
    )

  const steamApplicationEmbed = createSteamApplicationEmbed(
    steamApplicationData,
    chosenResult
  )

  return msg.channel.send(steamApplicationEmbed)
}

const createSteamApplicationEmbed = (
  data: SteamAppData,
  chosenResult: QueryResult
) => {
  const {
    name,
    short_description,
    header_image,
    price_overview,
    release_date,
    metacritic,
    developers,
    recommendations,
  } = data

  const fields = [
    {
      name: 'Release date',
      value: release_date ? release_date.date : 'TBA',
      inline: true,
    },
  ]

  if (metacritic) {
    fields.push({
      name: 'Metacritic',
      value: createMarkdownLink(metacritic.score.toString(), metacritic.url),
      inline: true,
    })
  }

  if (recommendations) {
    fields.push({
      name: 'Recommendations',
      value: recommendations.total.toString(),
      inline: true,
    })
  }

  if (price_overview) {
    const { initial, final, currency, discount_percent } = price_overview
    const isDiscounted = discount_percent !== 0

    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
    })

    // Format our price display to include discounted price if applicable.
    fields.push({
      name: 'Price',
      value: `${
        isDiscounted
          ? `~~${formatter.format(initial / 100)}~~ | ${formatter.format(
              final / 100
            )} (-${discount_percent}%)`
          : formatter.format(final / 100)
      }`,
      inline: false,
    })
  }

  if (developers) {
    fields.push({
      name: 'Developed by',
      value: developers.join(', '),
      inline: false,
    })
  }

  return createMessageEmbed({
    title: name,
    description: short_description,
    image: header_image,
    url: chosenResult.url,
    fields,
  })
}

const parseSteam = async (query: string[]) => {
  const urlString = `https://store.steampowered.com/search/?term=${query.join(
    ' '
  )}`

  const parser = new DOMParser()
  const htmlText = await getRawHTML(urlString)
  const document = parser.parseFromString(htmlText)

  //Results have data-search-page attribute with a value of 1.
  const nodes = document.getElementsByAttribute('data-search-page', '1')

  //Return early if no results are found
  if (!nodes || nodes.length === 0) {
    return {
      isEmpty: true,
      results: [],
    }
  }

  // Extract data from the href attribute of the node.
  const results = nodes.slice(0, 10).reduce<QueryResult[]>((carry, node) => {
    const url = node.getAttribute('href')

    if (url) {
      const appId = parseInt(url.split('/')[4])
      const appName = url.split('/')[5]

      return [
        ...carry,
        {
          url,
          appId,
          appName,
        },
      ]
    }
    return carry
  }, [])

  if (results.length === 0) {
    throw new Error('Error retrieving data from nodes')
  }

  return {
    isEmpty: false,
    results,
  }
}

const createSteamListMessageEmbed = (
  query: string[],
  results: QueryResult[]
): MessageEmbed => {
  const description = createPreparedListDescription(results)

  return createMessageEmbed({
    title: `Steam results for ${query.join(' ')} (${results.length} results)`,
    description,
    url: `https://store.steampowered.com/search/?term=${query.join('%20')}`,
  })
}

const createPreparedListDescription = (results: QueryResult[]) => {
  let baseDescription = ''

  // Append each result as a list item, create link for each.
  baseDescription += results
    .map(({ appName, url }, i) => {
      return `${i + 1}. ${createMarkdownLink(formatAppName(appName), url)}`
    })
    .join('\n')

  // Add info to instruct user how to interact

  baseDescription += '\r\n\n'

  baseDescription +=
    '<:bulb:815220090273267727> React with a number (<:one:815222400542048256>, <:two:815222472793784371>) to filter your results.\n\n'

  // Add info to instruct user how to delete
  baseDescription +=
    '<:cry:815224856312283156> React with <:x:815224717493141584> to delete.\n'

  return baseDescription
}

// For ease of use
const createMarkdownLink = (value: string, url: string) => `[${value}](${url})`

// Typical name would appear as This_Game__Special Edition, so we format that.
const formatAppName = (appName: string) =>
  appName.replace(/__/g, ' - ').replace(/_/g, ' ')

const getUserReaction = async (
  sentMsg: Message,
  authorId: string,
  results: QueryResult[]
): Promise<MessageReaction | undefined> => {
  const validEmojis = getValidEmojis(results.length)
  await attachMessageReactions(sentMsg, validEmojis)
  return getAuthorReaction(sentMsg, authorId, validEmojis)
}
