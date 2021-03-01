import https from 'https'

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
