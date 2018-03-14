import actionTypes from '../constants/actionTypes'

import configManager from '../managers/configManagers'

export const initialState = {
  definitions: {},
  subscription: [],
  pongTimestamp: Date.now(),
  pingTimestamp: Date.now(),
  pingState: 'ok'
}
const { pingAwareActionTypes, timeout } = configManager.getConfig()

const isPingAwareActionType = actionType => {
  const internalActionTypes = [actionTypes.AQUEDUX_PING, actionTypes.AQUEDUX_CHANNEL_SNAPSHOT]

  return internalActionTypes.includes(actionType) || pingAwareActionTypes.includes(actionType)
}

const reducer = (prevState = initialState, action) => {
  if (action.type === actionTypes.AQUEDUX_CLIENT_DEFINE_CHANNEL) {
    return {
      ...prevState,
      definitions: {
        ...prevState.definitions,
        [action.name]: { name: action.name }
      }
    }
  }
  if (action.type === actionTypes.AQUEDUX_CLIENT_JOIN_CHANNEL) {
    // The action.name here is already composed.
    return {
      ...prevState,
      subscription: [
        ...prevState.subscription.filter(sub => sub.name !== action.name),
        { name: action.name, id: action.id, template: !!action.id }
      ]
    }
  }
  if (action.type === actionTypes.AQUEDUX_CLIENT_LEAVE_CHANNEL) {
    const composedName = !!action.id ? action.name + '-' + action.id : action.name
    return {
      ...prevState,
      subscription: prevState.subscription.filter(sub => sub.name !== composedName)
    }
  }
  if (prevState.pingState !== 'restart') {
    if (isPingAwareActionType(action.type)) {
      return {
        ...prevState,
        pongTimestamp: action.timestamp
      }
    }
    if (action.type === actionTypes.AQUEDUX_PING_SENT) {
      const delta = action.timestamp - prevState.pongTimestamp
      return {
        ...prevState,
        pingTimestamp: action.timestamp,
        pingState: delta > timeout ? 'ko' : 'ok'
      }
    }
    if (action.type === actionTypes.AQUEDUX_PING_RESTART) {
      return {
        ...prevState,
        pingTimestamp: action.timestamp,
        pongTimestamp: action.timestamp,
        pingState: 'restart'
      }
    }
  } else {
    // During restart, if any action returns from the server, then we are connected.
    if (isPingAwareActionType(action.type)) {
      return {
        ...prevState,
        pongTimestamp: action.timestamp,
        pingTimestamp: action.timestamp,
        pingState: 'ok'
      }
    }
    if (action.type === actionTypes.AQUEDUX_PING_KO) {
      return {
        ...prevState,
        pingState: 'ko'
      }
    }
  }

  return prevState
}

export default reducer

export const selectors = {
  hasSubscription: (name, state) => state.aquedux.subscription.find(sub => sub.name === name),
  getSubscription: state => state.aquedux.subscription,
  hasChannel: (name, state) => state.aquedux.definitions.hasOwnProperty(name),
  ping: {
    getLastTimestamp: state => state.aquedux.pongTimestamp,
    getPingState: state => state.aquedux.pingState
  }
}
