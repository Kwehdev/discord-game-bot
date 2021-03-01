import { Message, MessageEmbed } from 'discord.js'
import DOMParser from 'dom-parser'
import { getRawHTML } from '../../utils/data'
import { createMessageEmbed, responseWithDeletion } from '../../utils/message'
import { QueryResult } from './types'

export default async function handleSteamCommand(
  msg: Message,
  query: string[]
) {
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

  const resultEmbedList = createSteamMessageEmbed(query, results)
  msg.channel.send(resultEmbedList)
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

const createSteamMessageEmbed = (
  query: string[],
  results: QueryResult[]
): MessageEmbed => {
  const description = createPreparedListDescription(results)

  return createMessageEmbed({
    title: `Steam results for ${query.join(' ')}`,
    description,
    url: `https://store.steampowered.com/search/?term=${query.join('%20')}`,
  })
}

const createPreparedListDescription = (results: QueryResult[]) => {
  let baseDescription = ''

  // Append each result as a list item, create link for each.
  baseDescription +=
    results
      .map(({ appName, url }, i) => {
        return `${i + 1}. ${createMarkdownLink(formatAppName(appName), url)}`
      })
      .join('\n') + '\n'

  // Add info to instruct user how to interact
  baseDescription +=
    '<:bulb:815220090273267727> React with a number (<:one:815222400542048256>, <:two:815222472793784371>) to filter your results.\n\n'

  // Add info to instruct user how to delete
  baseDescription +=
    '<:cry:815224856312283156> React with <:x:815224717493141584> to delete.\n'

  return baseDescription
}

const createMarkdownLink = (appName: string, url: string) =>
  `[${appName}](${url})`

const formatAppName = (appName: string) =>
  appName.split('__').join(' - ').split('_').join(' ')
