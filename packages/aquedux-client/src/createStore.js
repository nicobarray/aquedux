// @flow

import { createStore } from 'redux'

import actionTypes from './constants/actionTypes'
import channelManager from './managers/channelManager'
import { subscribe, unsubscribe } from './actionCreators'
import { register, events } from './utils/eventHub'

/**
 * Wrap the user reducer function to handle a snapshot override of the state tree.
 * The user reducer shape is not altered by this function and the reducer argument
 * do not behave differently outisde of the AQUEDUX_CHANNEL_SNAPSHOT action type.
 *
 * @param {Function} reducer A reducing function.
 */
function wrapStoreReducer(reducer) {
  return (state, action) => {
    const { type } = action

    if (type === actionTypes.AQUEDUX_CHANNEL_SNAPSHOT) {
      const { channelOrTemplateName } = action

      if (!channelManager.hasDef(channelOrTemplateName)) {
        throw Error(
          `The channel ${channelOrTemplateName} is not defined. ` +
            `Did you forget to add the "channels" option key to createAquedux() ?`
        )
      }

      const newState = channelManager.reduce(channelOrTemplateName)(state, action.snapshot)

      return reducer(newState, action)
    }

    return reducer(state, action)
  }
}

/**
 * Callback used on restart to resubscribe to previously active channels.
 *
 * @param {Store} store The redux store.
 */
const resubscriber = (store: any) => () => {
  const subs = channelManager.getSub()

  subs.forEach(sub => {
    if (sub.template) {
      const [name, id] = sub.name.split('-')

      store.dispatch(unsubscribe(name, id))
      store.dispatch(subscribe(name, id))
    } else {
      store.dispatch(unsubscribe(sub.name))
      store.dispatch(subscribe(sub.name))
    }
  })
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

  register(events.EVENT_ACTION_RECEIVE, store.dispatch)
  register(events.EVENT_CHANNEL_RESUBSCRIBE, resubscriber(store))

  return store
}
