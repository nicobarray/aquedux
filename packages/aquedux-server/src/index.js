// TODO: To this
import createAquedux from './createAquedux'
import createStore from './createStore'

// Private API
import aqueduxActions from './actions/api'
import { privateAnswer } from './utils/actionWrapper'
import actionTypes from './actionTypes'
import { subscribeToPrivateChannel } from './network/subscribe'
import { getFragmentsInfo } from './network/routes/fragments'
import { kickTank } from './managers/tankManager'

export {
  createAquedux,
  createStore,
  // Private API (do not document it)
  aqueduxActions,
  privateAnswer,
  subscribeToPrivateChannel,
  actionTypes,
  getFragmentsInfo,
  kickTank
}
