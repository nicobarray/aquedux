import actions from '../actions'
import channelManager from '../managers/channelManager'
import { selectors } from '../reducers'

export const addChannel = (store, name, reducer) => {
  store.dispatch(actions.channels.define(name))
  channelManager.define(name, reducer)
}

export const subscribeToChannel = (name, id) => (dispatch, getState) => {
  const composedName = id ? name + '-' + id : name

  if (selectors.hasSubscription(composedName, getState())) {
    // Do not subscribe twice to the same channel.
    return
  }

  console.log('AqueduxClient::subscribe', name, id)

  dispatch(actions.channels.join(name, id))
}

export const unsubscribeFromChannel = (name, id) => (dispatch, getState) => {
  const composedName = id ? name + '-' + id : name

  if (!selectors.hasSubscription(composedName, getState())) {
    // Do not unsubscribe to unsubscribed channel.
    return
  }

  console.log('AqueduxClient::unsubscribe', name, id)

  dispatch(actions.channels.leave(name, id))
}
