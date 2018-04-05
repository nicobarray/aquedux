import reverse from 'lodash/reverse'

import createSocketClient from './socketClient'
import channelManager from '../managers/channelManager'
import configManager from '../managers/configManager'
import { addChannel, subscribeToChannel } from '../network/channels'
import { selectors } from '../reducers'
import actions from '../actions'

import logger from '../utils/logger'
import * as fromConstants from '../utils/constants'
import actionTypes from '../constants/actionTypes'
import * as eventHub from '../utils/eventHub'
import localStorage from '../utils/localStorage'

const createAqueduxClient = (store, options) => {
  const { endpoint, timeout, hydratedActionTypes } = configManager.setConfig(options)

  let socket = null
  let pingIntervalId = null
  let restartTimeoutId = null
  let restartTimeoutDuration = 3000
  let actionStack = []

  // Ideally, these actions should not be sent back to client. Duplicates definition in middleware
  const isWiredActionType = actionType => {
    const internalActionTypes = [
      actionTypes.AQUEDUX_CLIENT_PING,
      actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN,
      actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE
    ]

    return internalActionTypes.indexOf(actionType) !== -1 || hydratedActionTypes.indexOf(actionType) !== -1
  }

  const _handleEventSend = action => {
    logger.trace({
      who: 'aqueduxClient::handleEventSend',
      what: 'received an action to send over aquedux',
      action,
      socket
    })

    // If the socket is not open, should we stack the actions OR ignore them?
    if (!socket || socket.readyState !== 1) {
      logger.trace({
        who: 'aqueduxClient::handleEventSend',
        what: 'the socket is null. stacking.',
        type: action.type
      })
      actionStack.push(action)
      return
    }

    const token = localStorage.getItem('token')
    if (token !== null) {
      action = {
        ...action,
        token
      }
    }

    socket.send(JSON.stringify(action))
  }

  const _handleClose = _socket => {
    eventHub.unregister(fromConstants.EVENT_SEND, _handleEventSend)
  }

  const _handleMessage = (socket, message) => {
    logger.trace({
      data: message.data,
      what: 'received message',
      who: 'aqueduxClient::_handleMessage'
    })
    let json

    try {
      json = JSON.parse(message.data)
    } catch (e) {
      logger.error({
        data: e,
        what: 'Invalid JSON message',
        who: 'aqueduxClient::_handleMessage'
      })
      return
    }
    // If the message has a type, then it is an action, therefore we dispatch it.
    if (!json.type) {
      logger.warn({
        data: json,
        what: 'Invalid redux action message',
        who: 'aqueduxClient::_handleMessage'
      })
      return
    }
    logger.trace({
      who: 'aqueduxClient::_handleMessage',
      what: 'valid json received',
      data: json
    })

    if (json.token) {
      localStorage.setItem('token', json.token)
    }

    if (json.type === 'AQUEDUX_CHANNEL_SNAPSHOT') {
      // If the channel is defined client-side, reduce the received action
      // with the current store.
      if (selectors.hasChannel(json.channelOrTemplateName, store.getState())) {
        store.dispatch({
          ...json,
          newState: channelManager.reduce(json.channelOrTemplateName)(store.getState(), json)
        })
      } else {
        logger.error({
          who: 'aqueduxClient::_handleMessage',
          what: 'channel is not defined client-side',
          channelName: json.channelName,
          data: json
        })
      }
      return
    } else if (isWiredActionType(json.type)) {
      /**
       * We need to change type to bypass potential user middlewares
       * Real action.type will be restored in aquedux middleware before hitting reducers
       */
      json = {
        ...json,
        originalActionType: json.type,
        type: actionTypes.AQUEDUX_CLIENT_MESSAGE_RECEIVED
      }
    }
    store.dispatch(json)
  }

  const _handleOpen = (isRestart = false) => {
    logger.trace({
      who: 'aqueduxClient::_handleOpen',
      what: 'send all stacked actions',
      actionStack
    })

    // Try to resubscribe to previously subscribed channels before loosing connection.
    if (isRestart) {
      console.log('Aquedux-client re-subscribing to previous channels')
      const subs = selectors.getSubscription(store.getState())
      subs.forEach(sub => {
        if (sub.template) {
          const [name, id] = sub.name.split('-')
          console.log(name, id)
          store.dispatch(actions.channels.leave(name, id))
          store.dispatch(subscribeToChannel(name, id))
        } else {
          store.dispatch(actions.channels.leave(sub.name))
          store.dispatch(subscribeToChannel(sub.name))
        }
      })
    } else {
      // Send stacked actions that occured when the socket was not ready yet.
      actionStack = reverse(actionStack)
      while (actionStack.length > 0) {
        const action = actionStack.pop()
        console.log('Send previously stacked action', action)
        _handleEventSend(action)
      }
    }
  }

  const setupPing = () => {
    // Setup ping
    clearInterval(pingIntervalId)
    pingIntervalId = setInterval(_handlePing, 1000)
  }

  const setupRestart = () => {
    clearTimeout(restartTimeoutId)
    restartTimeoutId = setTimeout(() => {
      if (selectors.ping.getPingState(store.getState()) === 'restart') {
        store.dispatch(actions.ping.ko())
      }
      if (restartTimeoutDuration <= 9000) {
        restartTimeoutDuration += 3000
      } else {
        restartTimeoutDuration = 9000
      }
    }, restartTimeoutDuration)
  }

  const start = (isRestart = false) => {
    if (isRestart) {
      socket.close()
      eventHub.unregister(fromConstants.EVENT_SEND, _handleEventSend)
    }

    eventHub.register(fromConstants.EVENT_SEND, _handleEventSend)
    socket = createSocketClient(endpoint, () => _handleOpen(isRestart), _handleClose, _handleMessage)
  }

  const _handlePing = () => {
    const pingState = selectors.ping.getPingState(store.getState())
    const delay = Date.now() - selectors.ping.getLastTimestamp(store.getState())

    // This case will happened once per restart attempt.
    if (pingState === 'ko') {
      // Change ping state to "restart"
      store.dispatch(actions.ping.restart())
      console.log('Restart timeout duration ', restartTimeoutDuration)
      setupRestart()

      start(true)
      setupPing()
    } else if (pingState === 'ok') {
      restartTimeoutDuration = 3000
      if (delay > timeout / 2) {
        store.dispatch(actions.ping.note())
        store.dispatch(actions.ping.send())
      }
    } else if (pingState === 'restart') {
      // Do nothing.
    }
  }

  return {
    start() {
      start()
      setupPing()
    },
    close() {
      if (socket) {
        socket.close()
      }
    },
    status() {
      return socket.readyState
    },
    addChannel: (name, reducer) => addChannel(store, name, reducer)
  }
}

export default createAqueduxClient
