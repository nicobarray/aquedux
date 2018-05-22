// @flow

import actionTypes from './constants/actionTypes'

export const subscribe = (name: string, id?: string) => ({
  type: actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN,
  name,
  id
})

export const unsubscribe = (name: string, id?: string) => ({
  type: actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE,
  name,
  id
})

export const start = () => ({
  type: actionTypes.AQUEDUX_CLIENT_START
})

export const stop = () => ({
  type: actionTypes.AQUEDUX_CLIENT_STOP
})

export const restart = () => ({
  type: actionTypes.AQUEDUX_CLIENT_RESTART
})
