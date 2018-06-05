// @flow

import http from 'http'

import configManager from '../managers/configManager'
import queueManager from '../managers/queueManager'

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  const { queueLimit } = configManager.getConfig()
  const fragments = queueManager.listQueues().map(queue => ({
    name: queue.name,
    fragmentIndex: queueLimit === 0 ? 0 : Math.floor(queue.cursor / queueLimit)
  }))

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ fragments }))
}
