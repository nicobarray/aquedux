// @flow

import { createStore } from 'redux'

import actionTypes from './constants/actionTypes'
import { register, events } from './utils/eventHub'

function wrapStoreReducer(userReducers) {
  return (prevState, action) => {
    if (action.type === actionTypes.queue.AQUEDUX_QUEUE_SNAPSHOT) {
      return {
        ...prevState,
        ...action.state,
        aquedux: prevState.aquedux
      }
    }

    return userReducers(prevState, action)
  }
}

/**
 * Enhance the redux createStore with the aquedux state wrapper and event handlers.
 *
 * @param {Function} reducer A reducing function.
 * @param {any} preloadedState The initial state.
 * @param {Function} enhancer The store enhancer.
 *
 * See https://redux.js.org/api-reference/createstore to know more about the function arguments.
 */
export default function(reducer: Function, preloadedState: any, enhancer: Function) {
  const wrappedReducer = wrapStoreReducer(reducer)
  const store = createStore(wrappedReducer, preloadedState, enhancer)

  register(events.EVENT_ACTION_RECEIVED, store.dispatch)

  return store
}
