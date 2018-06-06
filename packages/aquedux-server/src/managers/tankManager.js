// @flow

import type { Connection } from 'sockjs'

export type Tank = {|
  socket: Connection,
  channels: Array<string>,
  id: string
|}

type State = {
  [string]: Tank
}

let state: State = {}

function addTank(tankId: string, socket: Connection): void {
  if (state.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} is already registered in the tank manager.`)
  }

  state[tankId] = {
    id: tankId,
    socket,
    channels: []
  }
}

function removeTank(tankId: string, kick: boolean = false): void {
  if (!state.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} does not exists. Did you forgot to call tankManager.addTank ?`)
  }

  // There used to be a try-catch her. Why ? Let's see what pop's up without it.
  if (kick) {
    state[tankId].socket.close()
  }

  delete state[tankId]
}

function clear(): void {
  state = {}
}

function getTank(tankId: string): Tank {
  if (!state.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} does not exists. Did you forgot to call tankManager.addTank ?`)
  }

  return state[tankId]
}

function listAll(): Array<Tank> {
  return Object.keys(state).map(key => state[key])
}

function subscribe(tankId: string, channelName: string): void {
  if (!state.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} does not exists. Did you forgot to call tankManager.addTank ?`)
  }

  if (state[tankId].channels.indexOf(channelName) !== -1) {
    throw new Error(`Tank ${tankId} has already subscribe to ${channelName}.`)
  }

  state[tankId].channels.push(channelName)
}

function unsubscribe(tankId: string, channelName: string): void {
  if (!state.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} does not exists. Did you forgot to call tankManager.addTank ?`)
  }

  if (state[tankId].channels.indexOf(channelName) !== -1) {
    throw new Error(`Tank ${tankId} is not subscribe to ${channelName}.`)
  }

  state[tankId].channels = state[tankId].channels.filter(name => name !== channelName)
}

export default {
  addTank,
  removeTank,
  clear,
  getTank,
  listAll,
  subscribe,
  unsubscribe
}
