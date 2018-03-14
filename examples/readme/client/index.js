const { createAqueduxClient, aqueduxMiddleware, aqueduxReducer, wrapStoreReducer } = require('aquedux-client')
const { createStore, combineReducers, applyMiddleware } = require('redux')

/*
** Create reducer.
*/

const counter = (prevState = 42, action) => {
  if (action.type === 'INC') {
    return prevState + 1
  } else if (action.type === 'DEC') {
    return prevState - 1
  }

  return prevState
}

// It is mandatory to set the aquedux key and not aqueduxReducer.
const appReducers = combineReducers({
  counter,
  aquedux: aqueduxReducer
})

/*
** Create middleware.
*/

// The aquedux middleware must be the last one in the chain because it intercepts all whitelisted actions
// to send them over to the aquedux-server.
const appMiddlewares = applyMiddleware(aqueduxMiddleware)

/*
** Create store.
*/

// It is mandatory to wrap the app reducers to apply channel snapshots on first hydration and reconnections.
const store = createStore(wrapStoreReducer(appReducers), appMiddlewares)

/*
** Create aquedux server.
*/
const client = createAqueduxClient(store)

client.start('http://localhost:4242')
