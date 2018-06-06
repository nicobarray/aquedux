// @flow

import http from 'http'
import { flowRight } from 'lodash'

import createServer from './createServer'
import { type AqueduxConfig } from './managers/configManager'

import channelMiddleware from './middlewares/channel'
import routerMiddleware from './middlewares/router'
import apiMiddleware from './middlewares/api'

function chainMiddleware(...middlewares) {
  return (store: any) => (next: Function) => (action: Object) => {
    return flowRight(...middlewares.map(middleware => middleware(store)))(next)(action)
  }
}

function createMiddleware() {
  return chainMiddleware(apiMiddleware, routerMiddleware, channelMiddleware)
}

export default function createAquedux(options: AqueduxConfig, httpServer?: http.Server) {
  createServer(options).start(httpServer)
  // Else just return the middleware
  return createMiddleware()
}
