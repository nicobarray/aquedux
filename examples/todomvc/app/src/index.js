import React from 'react'
import { render } from 'react-dom'
import { applyMiddleware, compose } from 'redux'

/**
 * Replace redux createStore by aqedux-client one
 */
import { createAquedux, createStore, subscribe } from 'aquedux-client'
import { Provider } from 'react-redux'
import App from './components/App'
import reducer from './reducers'

/**
 * Import actionTypes that will be share across the network
 */
import {
  ADD_TODO,
  DELETE_TODO,
  EDIT_TODO,
  COMPLETE_TODO,
  COMPLETE_ALL_TODOS,
  CLEAR_COMPLETED
} from './constants/ActionTypes'

import 'todomvc-app-css/index.css'


/**
 * Configure aquedux-client with actionTypes and aquedux-server endpoint URL
 */
const aquedux = createAquedux({
  hydratedActionTypes: [ADD_TODO, DELETE_TODO, EDIT_TODO, COMPLETE_TODO, COMPLETE_ALL_TODOS, CLEAR_COMPLETED],
  endpoint: 'http://localhost:4242/aquedux',
  timeout: 10000,
  logLevel: 'trace',
  channels: [
    'todos'
  ]
})

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducer, composeEnhancers(applyMiddleware(aquedux)))

/**
 * In a real world app, this dispatch should be done in a container/component at route level
 */
store.dispatch(subscribe('todos'))

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
