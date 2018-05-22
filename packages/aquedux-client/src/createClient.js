// @flow

import SockJS from 'sockjs-client'

import actionTypes from './constants/actionTypes'
import configManager, { type AqueduxConfig } from './managers/configManager'
import { raise, register, unregister, events } from './utils/eventHub'
import localStorage from './utils/localStorage'

export default function createClient(options: AqueduxConfig) {
  const { endpoint, hydratedActionTypes } = configManager.setConfig(options)

  let socket: ?SockJS = null
  let actionStack: Array<Object> = []

  // Ideally, these actions should not be sent back to client. Duplicates definition in middleware
  function isWiredActionType(actionType: string): boolean {
    const internalActionTypes = [
      actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN,
      actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE,
      actionTypes.AQUEDUX_CHANNEL_SNAPSHOT
    ]

    return internalActionTypes.indexOf(actionType) !== -1 || hydratedActionTypes.indexOf(actionType) !== -1
  }

  function onSend(action) {
    // If the socket is not open, we stack the actions.
    if (!socket || socket.readyState !== 1) {
      actionStack.push(action)
      return
    }

    // Append our jwt from the local storage to the action before sending it.
    const token = localStorage.getItem('aquedux-jwt')
    if (token !== null) {
      action = {
        ...action,
        token
      }
    }

    socket.send(JSON.stringify(action))
  }

  function onMessage(socket, message) {
    const json = (() => {
      try {
        return JSON.parse(message.data)
      } catch (e) {
        return null
      }
    })()

    if (!json || !json.type) {
      console.error(`The client received an invalid message: ${JSON.stringify({ message: json }, null, 2)}`)
      return
    }

    // If the message has a jwt, override our own.
    if (json.token) {
      localStorage.setItem('aquedux-jwt', json.token)
    }

    const action = (() => {
      if (isWiredActionType(json.type)) {
        /**
         * We need to change type to bypass potential user middlewares
         * Real action.type will be restored in aquedux middleware before hitting reducers
         */
        return {
          ...json,
          originalActionType: json.type,
          type: actionTypes.AQUEDUX_CLIENT_MESSAGE_RECEIVED
        }
      } else {
        return json
      }
    })()

    raise(events.EVENT_ACTION_RECEIVE, action)
  }

  function onOpen(isRestart = false) {
    // Try to resubscribe to previously subscribed channels before loosing connection.
    if (isRestart) {
      raise(events.EVENT_CHANNEL_RESUBSCRIBE)
    } else {
      // Send stacked actions that occured when the socket was not ready yet.
      actionStack.forEach(onSend)
      actionStack = []
    }
  }

  function onStart(isRestart = false) {
    unregister(events.EVENT_CLIENT_START, onStart)
    register(events.EVENT_CLIENT_STOP, onStop)
    register(events.EVENT_CLIENT_RESTART, onRestart)
    register(events.EVENT_ACTION_SEND, onSend)

    socket = new SockJS(endpoint)
    socket.onopen = () => onOpen(isRestart)
    socket.onclose = () => onStop(socket)
    socket.onmessage = e => onMessage(socket, e)
  }

  function onStop(socket) {
    socket && socket.close()

    unregister(events.EVENT_ACTION_SEND, onSend)
    unregister(events.EVENT_CLIENT_STOP, onStop)
    unregister(events.EVENT_CLIENT_RESTART, onRestart)
    register(events.EVENT_CLIENT_START, onStart)
  }

  function onRestart() {
    onStop(socket)
    onStart(true)
  }

  onStart()
}
