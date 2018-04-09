# aquedux-server

  ## createAqueduxServer(store: Store, options: any = {})

  Creates the aquedux server used to initiate a sockJS connection with any incomming Aquedux client. *Required*

  The valid options are:

  * queueLimit: The channel's queue size in Redis (the unit is a Redux action). Default to 0 for unlimited size. If a positive size is specified, the Redis queues are split into chunks to manage a fixed Redis size over time.

  * hydratedActionTypes: The action types you wish aquedux to send over to clients. It **must** be the same as in the front-side configuration. Default to [].

  * routePrefix: A route prefix before the ending `/aquedux`. Default to ''.

  Example: If set to 'foo', `$HOST:$PORT/$routePrefix/aquedux`.

  * secret: A new JWT secret is generated at each start. User should override it with a contant one if he needs to persist some JWT token uppon server restart or client reconnection on a different server. Default to an auto-generated token.

  * redisHost: The Redis host used to persist channels informations. Default to `process.env.DB_PORT_6379_TCP_ADDR || '127.0.0.1'`.

  * redisPort: The redis port used to persist channels informations. Default to `process.env.DB_PORT_6379_TCP_PORT || '6379'`.

  ## aqueduxMiddleware

  Returns the aquedux middleware that receive actions and send them over the websocket connection. It must be added at the end of the middleware chain. *Required*

  ## aqueduxReducers

  The reducer used by aquedux to manager its dynamic state. It must be composed under the `aquedux` key with your app reducers. *Required*

  ```js
    const reducer = composeReducers({
      ...appReducers,
      aquedux: aqueduxReducer
    })
    const store = createStore(reducer, ...)
  ```

  ## wrapStoreReducer

  A store wrapper that handles the rehydratation of the store's state from Redis when a new subscribtion is issued from an aquedux client. *Required*

  ```js
    const reducer = wrapStoreReducer(
      composeReducers({
        ...appReducers,
        aquedux: aqueduxReducer
      })
    )

    const store = createStore(reducer, ...)
  ```

  ## Utilities

  ### privateAnswer

  Used to dispatch an action to a connected client and him only.

  ### subscribeToPrivateChannel

  Used for the api to subscribe itself to a channel. This can be used to persist a state that you don't want
  your users to see.
