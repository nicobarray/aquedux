# <img src='https://user-images.githubusercontent.com/4137761/37289440-f7a26b68-2609-11e8-8c23-fb8b49c53c90.png' height='60'>
> Redux over the wire

Aquedux is a Redux enhancer that enables seamless real-time synchronization across many JavaScript clients.

With Aquedux, you can write your server code with the same logic than your web/native app. There is no need to
use another library that forces you to add GraphQL or RESTfull endpoints. Everything is a Redux app.

Aquedux shares your App state across every connected instance. It can be a Node.js microservice, a React app, or anything you would imagine.

It makes the writing of client and server app easy. There is no need to add another technical layer. If you know how to use Redux, you know how to use Aquedux.

[![CI Status](https://circleci.com/gh/winamax/aquedux.svg?style=shield)](https://circleci.com/gh/Winamax/aquedux)
[![npm version](https://img.shields.io/npm/v/aquedux-client.svg?style=flat-square)](https://www.npmjs.com/package/aquedux-client)
[![npm version](https://img.shields.io/npm/v/aquedux-server.svg?style=flat-square)](https://www.npmjs.com/package/aquedux-server)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

# Installation

## Aquedux

If you use Yarn
```js
// Client side (aka browser & Redux app)
yarn add aquedux-client
// or
npm i aquedux-client
// Server side (aka Node.js & Redux app)
yarn add aquedux-server
// or
npm i aquedux-server
```

## Redis

For the aquedux-server app to work, you have to install a Redis server on your machine. Don't worry, if you have never installed one, it is extremly simple:

* On OSX: Install it with brew with `brew install redis-server`
* On Linux: Install it with your system package manager. For instance, if it is apt, with `apt-get install redis-server`
* On Windows: For windows you have two options, either download it from the redis website, or install it on your `Ubuntu On Windows`.

You don't have to configure anything, just running it.
You now should have a running instance on the localhost:XXXX port.

# Getting Started

Let see the required steps to integrate Aquedux in your current Redux workflow for the client and the server app.

## The client app

### Steps

* Use `Aquedux.createStore` instead of Redux's `createStore`
* Create the Aquedux client instance with `Aquedux.createClient`

### Gist

```js
// Instead of importing from redux, import from aquedux-client here!
import { createStore, createClient } from 'aquedux-client'

// Define the app reducer.
function counter(state = 0, action) {
  switch (action.type) {
  case 'INCREMENT':
    return state + 1
  case 'DECREMENT':
    return state - 1
  default:
    return state
  }
}

// Define our action types.
const actionTypes = ['INCREMENT', 'DECREMENT']

// Create a Redux store holding the state of your app.
const store = createStore(counter)

/* Create an Aquedux client instance.
*  
*  There is only two required options:
*  * hydratedActionTypes: A list of action to wire up. They are the only action types sent through Aquedux to other clients.
*  * endpoint: The server endpoint (by default it ends with /aquedux).
*/
const client = createClient(
  store,
  { 
    hydratedActionTypes: actionTypes,
    endpoint: 'localhost:3001/aquedux'
  }
)

// Define a channel to listen to other client modifications.
// The addChannel method takes a name and a state reducer.
// The state reducer is used when hydrating the client on first connection.
// After that, it's the incoming actions through that channel that will
// mutate the state.
client.addChannel('counter', (prevState, action) => {
    return action.snapshot;
});

// Start the websocket connection.
client.start()

// The action will not pass through the local Redux reducer. Instead, the action
// is dispatched through the socket to the Aquedux server. Once the action is
// safely persisted and reducers on the server-side, it is sent back and reduced locally.
store.dispatch({ type: 'INCREMENT' })
```

## The server app

### Steps

### Gist

```js
const { createStore } = require('redux')
const { createServer } = require('aquedux-server')

// Redefine the app reducer. Think about a shared module here.
function counter(state = 0, action) {
  switch (action.type) {
  case 'INCREMENT':
    return state + 1
  case 'DECREMENT':
    return state - 1
  default:
    return state
  }
}

// Define our action types.
const actionTypes = ['INCREMENT', 'DECREMENT']

// Create the redux store.
const store = createStore(counter);

/* Create an Aquedux server instance.

    There is only one required option:
      * hydratedActionTypes: A list of action to wire up. They are the only action types sent through Aquedux to other clients.
*/
const server = createServer(store, { hydratedActionTypes: actionTypes })

// Add the counter channel definition.
/*
    The first argument is the channel's name.
    The second argument is a predicate used to filter actions included in this channel.
    The third argument is a snapshot reducer. It is called to create the initial client-side store state when a client subscribe to this channel.
    FIXME: The last argument is the redis's queue prefix used to identify this channel's peristante data.
*/
server.addChannel(
    'counter',
    action => actionTypes.indexOf(action.type) !== -1,
    getState => getState(),
    'counter'
)

// Start the sockjs server.
server.start('0.0.0.0', 3001)
```

And you are good to go! For more help you can check out the example/ directory.

# API

wip
* [ ] Remove onAquedux
* [ ] Uniform aquedux-client.aqueduxReducer & aquedux-server.aqueduxReducers

## aquedux-client

  ### createStore(store, ...enhancers) // FIXME

  Returns a Redux store and initiate the aquedux client connection. It is a facade over the Redux's `createStore` method. See next method for more information about the option parameter.

  ! This method is a shortcut that do the following job.
  * Create a Redux's store with an aquedux wrapper other it.
  * Add the redux-thunk & aquedux in the middleware chain.
  * Create an aquedux client instance and starts the websocket connection.
  
  Therefore you do not have to call `createAqueduxClient`, `aqueduxMiddleware`, `aqueduxReducer` and `wrapStoreReducer`. For a more advance usage, create the Redux store your own way and use thoses methods to add aquedux support.

  ### createAqueduxClient(store, options = {})

  Returns an aquedux client used to send and listen to actions over a websocket connection with an aquedux-server instance.

  * **store**: The app's Redux store. *Required*
  * options: The client options. Understand the following keys:
      * hydratedActionTypes: An array of Redux action types to send over the websocket. Default to `[]`.
      * endpoint: The aquedux-server endpoint. Default to `'127.0.0.1'`.
      * timeout: The delay in milliseonds before the client instance switches to a disconnected state and tries to reconnect. Default to `5000`.
  
  ### aqueduxMiddleware

  Returns the aquedux middleware that intercept actions to send them over the websocket connection. It must be added at the end of the middleware chain.

  ### aqueduxReducer

  The reducer used by aquedux to manager its dynamic state. It must be composed under the `aquedux` key with your app reducers. *Required*

  ```js
    const reducer = composeReducers({
      ...appReducers,
      aquedux: aqueduxReducer
    })
    const store = createStore(reducer, ...)
  ```

  ### wrapStoreReducer

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

  ### onAquedux TO DELETE
  ### subscribeToChannel(name, id)

  An action creator to subscribe to an aquedux channnel. When the action is sent other the socket, the server returns a state snapshot of the channel's data. After that, until you unsubscribe from the channel, you will receive and reduce every actions related to it. The channels are described through the aquedux client object method `addChannel`.

  * name: The channel's name. *Required*
  * id: The channel's id. Used only if you want to handle entities through this channel. Default to `undefined`.

  ### unsubscribeFromChannel(name, id)

  An action creator to unsubscribe from an aquedux channnel. See above.

## aquedux-server

  ### Main API

  ### createAqueduxServer
  ### aqueduxMiddleware
  ### aqueduxReducers
  ### wrapStoreReducer

  ### Utilities

  ### aqueduxActions
  ### onAquedux TO DELETE
  ### privateAnswer
  ### subscribeToPrivateChannel
  ### getChannelsOf
  ### actionTypes
  ### getFragmentsInfo
  ### kickTank

# FAQ

* Is it used somewhere?

At Winamax. We uses it on two projects that helped shape Aquedux the way it is. We
hope that by open-sourcing the project, more project will uses it and make its API
and internals evolve.

* Can I contribute?

If you find bugs or have enhancement proposal, do not esitate to create an issue. The authors will continue to improve it and watch over the project. When aquedux
reaches a more stable phase, we'll gladely accept pull requests.

# Authors

* Nicolas Barray ([@nek0las](https://github.com/nbarray)) -
[Winamax](https://www.winamax.fr/)
* CHaBou ([@chabou](https://github.com/chabou)) -
[Winamax](https://www.wiamax.fr/)
