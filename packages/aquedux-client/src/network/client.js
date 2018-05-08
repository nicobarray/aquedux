import reverse from 'lodash/reverse'

import actionTypes from '../constants/actionTypes'
import channelManager from '../managers/channelManager'
import configManager from '../managers/configManager'
import { addChannel, subscribeToChannel } from '../network/channels'
import logger from '../utils/logger'
import * as eventHub from '../utils/eventHub'
import localStorage from '../utils/localStorage'
import { selectors } from '../reducers'
import actions from '../actions'
import createSocketClient from './socketClient'

const createAqueduxClient = (store, options) => {
  const { endpoint, hydratedActionTypes } = configManager.setConfig(options)

  let socket = null
  let actionStack = []

  // Ideally, these actions should not be sent back to client. Duplicates definition in middleware
  const isWiredActionType = actionType => {
    const internalActionTypes = [actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN, actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE]

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
    eventHub.unregister(eventHub.EVENT_SEND, _handleEventSend)
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

  const start = (isRestart = false) => {
    if (isRestart) {
      socket.close()
      eventHub.unregister(eventHub.EVENT_SEND, _handleEventSend)
    }

    eventHub.register(eventHub.EVENT_SEND, _handleEventSend)
    socket = createSocketClient(endpoint, () => _handleOpen(isRestart), _handleClose, _handleMessage)
  }

  return {
    start,
    close() {
      socket && socket.close()
    },
    status() {
      return socket && socket.readyState
    },
    addChannel: (name, reducer) => addChannel(store, name, reducer)
  }
}

export default createAqueduxClient
