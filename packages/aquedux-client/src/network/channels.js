import actions from '../actions'
import channelManager from '../managers/channelManager'
import { selectors } from '../reducers'

export const addChannel = (store, name, reducer) => {
  store.dispatch(actions.channels.define(name))
  channelManager.define(name, reducer)
}

export const subscribeToChannel = (name, id) => (dispatch, getState) => {
  const composedName = id ? name + '-' + id : name
  const subs = selectors.getSubscription(getState())
  if (selectors.hasSubscription(composedName, getState())) {
    // Do not subscribe twice to the same channel.
    return
  }

  console.log('AqueduxClient::subscribe', composedName, id)

  dispatch(actions.channels.join(composedName, id))
  dispatch({
    type: 'AQUA:SUB:' + name,
    id
  })
}

export const unsubscribeFromChannel = (name, id) => (dispatch, getState) => {
  const composedName = id ? name + '-' + id : name
  const subs = selectors.getSubscription(getState())
  if (selectors.hasSubscription(composedName, getState())) {
    // Do not subscribe twice to the same channel.
    return
  }

  console.log('AqueduxClient::unsubscribe', key, dataType, id)

  dispatch(actions.channels.leave(composedName, id))
  dispatch({
    type: 'AQUA:UNSUB:' + dataType,
    id
  })
}
