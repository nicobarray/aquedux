import { createStore, applyMiddleware } from 'redux'
import * as fromAquedux from 'aquedux-server'

import appReducer from './reducers'
import {
  ADD_TODO,
  DELETE_TODO,
  EDIT_TODO,
  COMPLETE_TODO,
  COMPLETE_ALL_TODOS,
  CLEAR_COMPLETED
} from './constants/ActionTypes'

/**
 * Configure redux store
 */
const enhancers = applyMiddleware(fromAquedux.aqueduxMiddleware)
const store = createStore(appReducer, {}, enhancers)

/**
 * Configure aquedux-server
 */
const aqueduxOptions = {
  hydratedActionTypes: [ADD_TODO, DELETE_TODO, EDIT_TODO, COMPLETE_TODO, COMPLETE_ALL_TODOS, CLEAR_COMPLETED],
  secret: 'todoExample'
}
const server = fromAquedux.createAqueduxServer(store, aqueduxOptions)

server.addChannel(
  'todos',
  action => aqueduxOptions.hydratedActionTypes.indexOf(action.type) !== -1,
  getState => {
    const todos = getState().todos
    return todos
  },
  'todos'
)

/**
 * Start server
 */
const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '4242'

server.start(host, port)
