// @flow

import http from 'http'

import configManager from './managers/configManager'

import getFragmentsRoute from './network/routes/fragments'
import getFragmentRoute from './network/routes/fragment'
import getChannelsRoute from './network/routes/channels'
import getTanksRoute from './network/routes/tanks'

// TODO: COME BACK TO WORK HERE TOMOROW YOU FUCKER

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  const { prefixRoute } = configManager.getConfig()

  if (req.method === 'GET' && req.url === path.join(prefixRoute, 'fragments')) {
    getFragmentsRoute(store)(req, res)
  } else if (req.method === 'GET' && req.url.indexOf(path.join(prefixRoute, 'fragments')) === 0) {
    getFragmentRoute(prefixRoute)(req, res)
  } else if (req.method === 'GET' && req.url === path.join(prefixRoute, 'channels')) {
    getChannelsRoute(req, res)
  } else if (req.method === 'GET' && req.url === path.join(prefixRoute, 'tanks')) {
    getTanksRoute(req, res)
  } else {
    res.writeHead(404)
  }
}
