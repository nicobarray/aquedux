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

    There is only three required options:
      * hydratedActionTypes: A list of action to wire up. They are the only action types sent through Aquedux to other clients.
      * host: The server's host.
      * port: The server's port.
*/
const server = createServer(
  store,
  {
    hydratedActionTypes: actionTypes,
    host: '0.0.0.0',
    port: 3001
  }
)

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

# API

# FAQ

# Authors

* Nicolas Barray ([@nek0las](https://github.com/nbarray)) -
[Winamax](https://www.winamax.fr/)
* CHaBou ([@chabou](https://github.com/chabou)) -
[Winamax](https://www.wiamax.fr/)
