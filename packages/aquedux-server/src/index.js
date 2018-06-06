// TODO: To this
import createAquedux from './createAquedux'
import createStore from './createStore'
import requestListener from './requestListener'

// Private API
import { privateAnswer } from './utils/actionWrapper'
// import { subscribeToPrivateChannel } from './network/subscribe'
import { kickTank } from './managers/tankManager'
import { close } from './actionCreators'

export {
  createAquedux,
  createStore,
  requestListener,
  // Private API (do not document it)
  privateAnswer,
  // subscribeToPrivateChannel,
  kickTank,
  close
}
