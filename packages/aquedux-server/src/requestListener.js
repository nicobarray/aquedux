// @flow

import http from 'http'
import path from 'path'

import configManager from './managers/configManager'

import getFragmentsRoute from './monitor/fragments'
import getFragmentRoute from './monitor/fragment'
import getChannelsRoute from './monitor/channels'
import getTanksRoute from './monitor/tanks'

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  const { routePrefix } = configManager.getConfig()

  if (req.method === 'GET' && req.url === path.join(routePrefix, 'monitor', 'fragments')) {
    getFragmentsRoute(req, res)
  } else if (req.method === 'GET' && req.url.indexOf(path.join(routePrefix, 'monitor', 'fragments')) === 0) {
    getFragmentRoute(req, res)
  } else if (req.method === 'GET' && req.url === path.join(routePrefix, 'monitor', 'channels')) {
    getChannelsRoute(req, res)
  } else if (req.method === 'GET' && req.url === path.join(routePrefix, 'monitor', 'tanks')) {
    getTanksRoute(req, res)
  } else {
    res.writeHead(404)
  }
}
