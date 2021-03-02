import https from 'https'
import fetch from 'node-fetch'
import { QueryResult } from '../commands/steam/types'

export const getRawHTML = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => resolve(data))
      res.on('error', (err) => reject(err))
    })
  })
}

export const fetchJSONResponse = async (url: string): Promise<unknown> => {
  return fetch(url).then((res) => res.json())
}

type SteamAPIResponse = {
  [key: string]: {
    success: boolean
    data: SteamAppData
  }
}

export type SteamAppData = {
  name: string
  short_description: string
  header_image: string
  price_overview: {
    initial: number
    final: number
    currency: 'EUR' | 'USD'
    discount_percent: number
  }
  release_date: {
    date: string
  }
  metacritic: {
    score: number
    url: string
  }
  developers: string[]
  recommendations: {
    total: number
  }
}

export const handleSteamAPIRequest = async (
  chosenResult: QueryResult
): Promise<SteamAppData | null> => {
  const { appId } = chosenResult

  const data = (await fetchJSONResponse(
    `https://store.steampowered.com/api/appdetails/?appids=${appId}`
  )) as SteamAPIResponse

  if (!data[appId].success) {
    return null
  }

  return data[appId].data
}
