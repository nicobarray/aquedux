import { createStore, applyMiddleware } from 'redux'
import * as fromAquedux from 'aquedux-server'

import appReducer from './reducers'

const configureStore = () => {

  const enhancers = applyMiddleware(fromAquedux.aqueduxMiddleware)

  return createStore(appReducer, {}, enhancers)
}

export default configureStore
