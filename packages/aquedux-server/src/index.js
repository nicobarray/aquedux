import createAqueduxServer from './network/server'
import aqueduxReducers from './reducers'
import aqueduxMiddleware from './middleware'
import aqueduxActions from './actions/api'
import onAquedux, { privateAnswer } from './utils/actionWrapper'
import { getChannelsOf } from './network/channels'
import registerActions from './statefullTypes'
import actionTypes from './actionTypes'
import configManager from './managers/configManager'
import wrapStoreReducer from './wrapStoreReducer'
import { subscribeToPrivateChannel } from './network/subscribe'
import { getFragmentsInfo } from './network/routes/fragments'
import { kickTank } from './managers/tankManager'

const setReduceStateToQueueSnapshot = configManager.setReduceStateToQueueSnapshot

export {
  createAqueduxServer,
  aqueduxReducers,
  aqueduxMiddleware,
  aqueduxActions,
  onAquedux,
  privateAnswer,
  subscribeToPrivateChannel,
  getChannelsOf,
  registerActions,
  actionTypes,
  setReduceStateToQueueSnapshot,
  wrapStoreReducer,
  getFragmentsInfo,
  kickTank
}
