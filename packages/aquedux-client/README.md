
# aquedux-client

  Redux over the wire - client side

  ## Quickstart

  To enable your client app with aquedux, do the following:
  
  * Initialize the aquedux middleware with the `aquedux = createAquedux(...)` method.
  * Create a redux store using our enhanced `createStore` method and apply it the newly created `aquedux` middleware.

  Example:

  ```js
    import { createStore, createAquedux } from 'aquedux-client'
    import { applyMiddleware } from 'redux'

    import todos from './my-todo-reducer'

    const aquedux = createAquedux({
      hydratedActionTypes: ['TODO_ADD', 'TODO_TOGGLE'],
      endpoint: 'http://localhost:3001',
      channels: [ 'todos' ]
    })

    const reducer = (prevState, action) => {
      return {
        ...prevState,
        todos: todos(prevState.todos, action)
      }
    }

    const store = createStore(reducer, { todos: {} }, applyMiddleware(aquedux))
  ```

  ## API

  ### createStore(reducer, preloadedState, enhancer)

  Returns a Redux store with an aquedux wrapper over your reducer and initiate the aquedux client connection. It is a facade over the Redux's `createStore` method. See next method for more information about the option parameter.
  
  See https://redux.js.org/api-reference/createstore to know more about the function arguments.

  ### createAquedux(options = {})

  Returns an aquedux middleware used to send and listen to actions over a websocket connection with an aquedux-server instance.

  
  * options: The client options. Understand the following keys:

  | key                 | type                                                                  | defaultValue | description                                   |
  | ------------------- | --------------------------------------------------------------------- | ------------ | --------------------------------------------- |
  | hydratedActionTypes | `Array<string>`                                                       | `[]`         | Redux action types to send over the websocket |
  | endpoint            | `string`                                                              | `127.0.0.1`  | The aquedux-server endpoint                   |
  | channels            | `Array<string | { name: string, reduce: (Object, Object) => Object }` | []           | Channel definitions (see bellow)              |
  

  A channel definition can be of two shapes:

      * A simple `string` identifying a root state key. The snapshot reducer is therefore defaulted.
      * An object understanding the following keys:
          * name: The `string` identiying the channel.
          * reduce: A reduce function `(prevState, snapshot) => nextState`

  Example:
  ```js
    const aquedux = createAquedux({
      hydratedActionTypes: ['TODO_ADD', 'TODO_TOGGLE'],
      endpoint: 'https://my-awesome-endpoint.io/aquedux',
      channels: [
        'todos',
        {
          name: 'visibilityFilter',
          reduce: (prevState, snapshot) => {
            return {
              ...prevState,
              visibilityFilter: snapshot
            }
          }
        }
      ]
    })
  ```
  
  ### subscribe(name, id)

  An action creator to subscribe to an aquedux channnel. When the action is sent other the socket, the server returns a state snapshot of the channel's data. After that, until you unsubscribe from the channel, you will receive and reduce every actions related to it. The channels are described through the aquedux client object method `addChannel`.

  * name: The channel's name. *Required*
  * id: The channel's id. Used only if you want to handle entities through this channel. Default to `undefined`.

  ### unsubscribe(name, id)

  An action creator to unsubscribe from an aquedux channnel. See above.

  ### start()

  An action creator to start the socket connection to aquedux-server. Aquedux initiate the connection by default. This is useful only if you have stopped the client with the `stop()` action.

  ### stop()

  An action creator to stop the socket connection to aquedux-server.

  ### restart()

  An action creator to restart the connection to aquedux-server. 