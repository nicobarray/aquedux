// @flow

import http from 'http'

import configManager from '../managers/configManager'
import queueManager from '../managers/queueManager'

export const routeSuffix = '/monitor/fragments/'

function error(channelName, error) {
  return {
    name: channelName,
    error
  }
}

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  const { queueLimit, routePrefix } = configManager.getConfig()
  const channelName = req.url.substr((routePrefix + routeSuffix).length)

  const fragment = queueManager
    .getCursor(channelName)
    .map(cursor => (queueLimit === 0 ? 0 : Math.floor(cursor / queueLimit)))
    .map(fragmentIndex => ({
      name: channelName,
      fragmentIndex
    }))
    .option(error(channelName, 'The channel does not exists.'))

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({
      fragment
    })
  )
}
