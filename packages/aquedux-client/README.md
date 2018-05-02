
# aquedux-client

  Redux over the wire - client side

  ## createStore(reducer, ...enhancers)

  Returns a Redux store and initiate the aquedux client connection. It is a facade over the Redux's `createStore` method. See next method for more information about the option parameter.

  :warning: This method is a shortcut that do the following job.
  * Create a Redux's store with an aquedux wrapper other it.
  * Add the redux-thunk & aquedux in the middleware chain.
  * Create an aquedux client instance and starts the websocket connection.
  
  Therefore you do not have to call `aqueduxMiddleware`, `aqueduxReducer` and `wrapStoreReducer`. For a more advance usage, create the Redux store your own way and use thoses methods to add aquedux support.

  ## combineReducers(reducersObject)
  It is a facade over the Redux's `combineReducers` method. It acts like it but it automatically adds required internal aquedux reducer.

  If you prefer using regular redux combineReducers function, you can add the aquedux reducer manually:
  ```js
    import { aqueduxReducer } from 'aquedux-client'
    const reducer = composeReducers({
      ...appReducers,
      aquedux: aqueduxReducer
    })
    const store = createStore(reducer, ...)
  ```

  :warning: You have to add aquedux reducer. If you have a only one reducer, please use combineReducers with it.

  ## createAqueduxClient(store, options = {})

  Returns an aquedux client used to send and listen to actions over a websocket connection with an aquedux-server instance.

  * **store**: The app's Redux store. *Required*
  * options: The client options. Understand the following keys:
      * hydratedActionTypes: An array of Redux action types to send over the websocket. Default to `[]`.
      * endpoint: The aquedux-server endpoint. Default to `'127.0.0.1'`.
      * timeout: The delay in milliseonds before the client instance switches to a disconnected state and tries to reconnect. Default to `5000`.
  
  ## aqueduxMiddleware

  Returns the aquedux middleware that intercept actions to send them over the websocket connection. It must be added at the end of the middleware chain.

  ## wrapStoreReducer

  A store wrapper that handles the rehydratation of the store's state when subscribing to an aquedux channel. *Required*

  ```js
    const reducer = wrapStoreReducer(
      composeReducers({
        ...appReducers,
        aquedux: aqueduxReducer
      })
    )

    const store = createStore(reducer, ...)
  ```

  ## subscribeToChannel(name, id)

  An action creator to subscribe to an aquedux channnel. When the action is sent other the socket, the server returns a state snapshot of the channel's data. After that, until you unsubscribe from the channel, you will receive and reduce every actions related to it. The channels are described through the aquedux client object method `addChannel`.

  * name: The channel's name. *Required*
  * id: The channel's id. Used only if you want to handle entities through this channel. Default to `undefined`.

  ## unsubscribeFromChannel(name, id)

  An action creator to unsubscribe from an aquedux channnel. See above.
