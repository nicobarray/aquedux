import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, subscribeToChannel } from 'aquedux-client'
import App from './components/App'
import rootReducer from './reducers'
import configureAquedux from './configureAquedux'

//const store = createStore(rootReducer)
const store = createStore(rootReducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

const port = process.env.REACT_APP_AQUEDUX_PORT || '4242'
const host = process.env.REACT_APP_AQUEDUX_HOST || 'localhost'
const protocol = process.env.REACT_APP_AQUEDUX_PROTOCOL || 'http'

const endpoint = `${protocol}://${host}:${port}/aquedux`
const aquedux = configureAquedux(store, endpoint)
aquedux.start()
/**
 * In a real world app, this dispatch should be done in a container/component at route level
 */
store.dispatch(subscribeToChannel('todos'))

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
