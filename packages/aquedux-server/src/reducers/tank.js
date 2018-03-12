// @flow

import type { Action } from 'redux'

import actionTypes from '../constants/actionTypes'

import type { TankStateType, TanksStateType } from '../constants/types'

export const initialState: TanksStateType = {
  tanks: {}
}

const reducer = (prevState: TanksStateType = initialState, action: Action): TanksStateType => {
  if (action.type === actionTypes.tank.AQUEDUX_TANK_CONNECT) {
    return {
      ...prevState,
      tanks: {
        ...prevState.tanks,
        [action.tankId]: {
          id: action.tankId,
          channels: []
        }
      }
    }
  }
  if (action.type === actionTypes.tank.AQUEDUX_TANK_DISCONNECT) {
    const { [action.tankId]: removed, ...otherTanks } = prevState.tanks
    return {
      ...prevState,
      tanks: otherTanks
    }
  }
  if (action.type === actionTypes.tank.AQUEDUX_TANK_SUBSCRIBE) {
    if (!prevState.tanks.hasOwnProperty(action.tankId)) {
      return prevState
    }
    return {
      ...prevState,
      tanks: {
        ...prevState.tanks,
        [action.tankId]: {
          ...prevState.tanks[action.tankId],
          channels: [...prevState.tanks[action.tankId].channels, action.channelName]
        }
      }
    }
  }
  if (action.type === actionTypes.tank.AQUEDUX_TANK_UNSUBSCRIBE) {
    if (!prevState.tanks.hasOwnProperty(action.tankId)) {
      return prevState
    }
    return {
      ...prevState,
      tanks: {
        ...prevState.tanks,
        [action.tankId]: {
          ...prevState.tanks[action.tankId],
          channels: prevState.tanks[action.tankId].channels.filter(channelName => channelName !== action.channelName)
        }
      }
    }
  }
  return prevState
}

export default reducer

export const selectors = {
  getTankChannels: (tankId: string, state: TanksStateType): Array<string> => {
    if (!state.tanks.hasOwnProperty(tankId)) {
      throw new Error(`The tank ${tankId} does not exists. He may be disconnected?`)
    }
    return state.tanks[tankId].channels
  },
  listOthers: (tankId: string, state: TanksStateType): Array<TankStateType> => {
    return Object.keys(state.tanks)
      .filter(id => id !== tankId)
      .map(id => state.tanks[id])
  },
  listAll: (state: TanksStateType): Array<TankStateType> => {
    return Object.keys(state.tanks).map(id => state.tanks[id])
  }
}
