import { createAqueduxClient } from 'aquedux-client'

const configureAquedux = (store, endpoint) => {
  // Set actionTypes that should be sent over Aquedux and its enpoint
  const aqueduxOptions = {
    hydratedActionTypes: ['ADD_TODO', 'TOGGLE_TODO'],
    endpoint
  }
  const client = createAqueduxClient(store, aqueduxOptions)

  // Declare a channel with a way to reduce its snapshot
  client.addChannel('todos', (oldState, action) => {
    return {
      ...oldState,
      todos: action.snapshot
    }
  })
  return client
}

export default configureAquedux
