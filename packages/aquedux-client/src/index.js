import createAqueduxClient from './network/client'
import aqueduxReducer from './reducers'
import middleware from './network/middleware'
import { subscribeToChannel, unsubscribeFromChannel } from './network/channels'
import createStore from './createStore'
import wrapStoreReducer from './wrapStoreReducer'

const aqueduxMiddleware = middleware

export {
  createStore,
  aqueduxMiddleware,
  aqueduxReducer,
  createAqueduxClient,
  wrapStoreReducer,
  subscribeToChannel,
  unsubscribeFromChannel
}
