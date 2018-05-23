import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { applyMiddleware, compose } from 'redux'
import { createStore, createAquedux, subscribe } from 'aquedux-client'
import App from './components/App'
import rootReducer from './reducers'

const port = process.env.REACT_APP_AQUEDUX_PORT || '4242'
const host = process.env.REACT_APP_AQUEDUX_HOST || 'localhost'
const protocol = process.env.REACT_APP_AQUEDUX_PROTOCOL || 'http'

const aquedux = createAquedux({
  hydratedActionTypes: ['ADD_TODO', 'TOGGLE_TODO'],
  endpoint: `${protocol}://${host}:${port}/aquedux`,
  channels: [ 'todos' ]
})

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(rootReducer, composeEnhancers(applyMiddleware(aquedux)))

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
