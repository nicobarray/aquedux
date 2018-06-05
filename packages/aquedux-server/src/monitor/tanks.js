// @flow

import http from 'http'

import tankManager from '../managers/tankManager'

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(tankManager.listAll()))
}
