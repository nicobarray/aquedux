import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import wrapStoreReducer from './wrapStoreReducer'
import middleware from './network/middleware'

export default (userReducers, preloadedState, userEnhancer = arg => arg) => {
  const reducers = wrapStoreReducer(userReducers)

  const enhancer = compose(applyMiddleware(thunk), userEnhancer, applyMiddleware(middleware))

  return createStore(reducers, preloadedState, enhancer)
}
