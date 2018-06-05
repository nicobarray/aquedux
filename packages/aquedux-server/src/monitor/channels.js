// @flow

import http from 'http'

import channelManager from '../managers/channelManager'

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(channelManager.listChannels()))
}
