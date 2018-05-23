// @flow

import { flowRight } from 'lodash'

import createClient from './createClient'
import { type AqueduxConfig } from './managers/configManager'
import channelMiddleware from './middlewares/channel'
import clientMiddleware from './middlewares/client'
import routerMiddleware from './middlewares/router'

function chainMiddleware(...middlewares) {
  return (store: any) => (next: Function) => (action: Object) => {
    return flowRight(...middlewares.map(middleware => middleware(store)))(next)(action)
  }
}

function createMiddleware() {
  return chainMiddleware(clientMiddleware, routerMiddleware, channelMiddleware)
}

export default function createAquedux(options: AqueduxConfig) {
  createClient(options)
  return createMiddleware()
}
