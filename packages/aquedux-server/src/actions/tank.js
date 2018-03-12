// @flow

import actionTypes from '../constants/actionTypes'

const connect = (tankId: string) => {
  return {
    type: actionTypes.tank.AQUEDUX_TANK_CONNECT,
    tankId
  }
}

const disconnect = (tankId: string) => {
  return {
    type: actionTypes.tank.AQUEDUX_TANK_DISCONNECT,
    tankId
  }
}

const subscribe = (tankId: string, channelName: string) => {
  return {
    type: actionTypes.tank.AQUEDUX_TANK_SUBSCRIBE,
    tankId,
    channelName
  }
}

const unsubscribe = (tankId: string, channelName: string) => {
  return {
    type: actionTypes.tank.AQUEDUX_TANK_UNSUBSCRIBE,
    tankId,
    channelName
  }
}

export default {
  connect,
  disconnect,
  subscribe,
  unsubscribe
}
