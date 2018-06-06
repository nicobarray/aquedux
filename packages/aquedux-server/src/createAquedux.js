// @flow

import { flowRight } from 'lodash'

import createServer from './createServer'
import { type AqueduxConfig } from './managers/configManager'

import channelMiddleware from './middlewares/channel'
import routerMiddleware from './middlewares/router'

function chainMiddleware(...middlewares) {
  return (store: any) => (next: Function) => (action: Object) => {
    return flowRight(...middlewares.map(middleware => middleware(store)))(next)(action)
  }
}

function createMiddleware() {
  return chainMiddleware(routerMiddleware, channelMiddleware)
}

export default function createAquedux(options: AqueduxConfig) {
  createServer(options)
  return createMiddleware()
}
