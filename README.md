# <img src='https://user-images.githubusercontent.com/4137761/37289440-f7a26b68-2609-11e8-8c23-fb8b49c53c90.png' height='60'>
> Redux over the wire

Aquedux is a Redux enhancer that enables seamless real-time synchronization across many JavaScript clients.

[![CI Status](https://circleci.com/gh/winamax/aquedux.svg?style=shield)](https://circleci.com/gh/Winamax/aquedux)
[![npm version](https://img.shields.io/npm/v/aquedux-client.svg?style=flat-square)](https://www.npmjs.com/package/aquedux-client)
[![npm version](https://img.shields.io/npm/v/aquedux-server.svg?style=flat-square)](https://www.npmjs.com/package/aquedux-server)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

# What am I and how can I help you ?

With Aquedux, you can write your server code with the same logic than your web/native app. There is no need to
use another library that forces you to add GraphQL or RESTfull endpoints. Everything is a Redux app.

Aquedux shares your App state across every connected instance. It can be a Node.js microservice, a React app, or anything you would imagine.

It makes the writing of client and server app easy. There is no need to add another technical layer. If you know how to use Redux, you know how to use Aquedux.

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
You should now have a running Redis instance.

# Getting Started

Let see the required steps to integrate Aquedux in your current Redux workflow for the client and the server app.

## The client app

```js
/****************************
*    configureAquedux.js    *
****************************/

import { createAqueduxClient } from 'aquedux-client'

const configureAquedux = (store, endpoint) => {
  // Set actionTypes that should be sent over Aquedux and its enpoint
  const aqueduxOptions = {
    hydratedActionTypes: ['ADD_TODO', 'TOGGLE_TODO'],
    endpoint
  }

  // Create the client instance.
  const client = createAqueduxClient(store, aqueduxOptions)

  // Declare a channel with a way to reduce its snapshot. This is used to group action types and store slices.
  // The reducer tells Aquedux how to reduce into your state the slice sent over by Aquedux as the channel
  // initial state.
  client.addChannel('todos', (oldState, action) => {
    return {
      ...oldState,
      todos: action.snapshot
    }
  })

  return client
}

export default configureAquedux

/****************************
*    configureStore.js      *
****************************/

import { createStore, subscribeToChannel } from 'aquedux-client'
import configureAquedux from './configureAquedux'
import rootReducer from './reducers'

const configureStore = () => {
  const store = createStore(rootReducer)

  // The default route served by aquedux-server is $YOUR_HOST/aquedux
  const endpoint = `${protocol}://${host}:${port}/aquedux`
  const aquedux = configureAquedux(store, endpoint)

  aquedux.start()

  return store;
}

// In a real world app, this dispatch should be done in a container/component at route level or cDM.

// When subscribing to a channel you are telling Aquedux to receive all related actions in real-time.
// The first action you receive is the channel's state snapshot.
store.dispatch(subscribeToChannel('todos'))
```

## The server app

```js
/****************************
*    configureAquedux.js    *
****************************/

import { createAqueduxServer } from 'aquedux-server'

const todoTypes = ['ADD_TODO', 'TOGGLE_TODO']

const configureAquedux = (store, host, port) => {
  const aqueduxOptions = {
    hydratedActionTypes: todoTypes,
    secret: 'todoExample'
  }

  let server = createAqueduxServer(store, aqueduxOptions)

  // The server-side channel definition.
  //
  // It takes a name to identify it (same as for the front-side definition).
  // It takes a predicate to filter action types related to it.
  // It takes a reducer to translate the desired state into a snapshot for first front-side hydratation.
  // The last argument is a key prefix used to store the channels action.
  server.addChannel(
    'todos',
    action => todoTypes.indexOf(action.type) !== -1,
    getState => {
      const todos = getState().todos
      return todos
    },
    'todos'
  )

  return () => server.start(host, port)
}

export default configureAquedux

/****************************
*    configureStore.js      *
****************************/

import { createStore, applyMiddleware } from 'redux'
import * as fromAquedux from 'aquedux-server'
import rootReducer from './reducers'

const configureStore = () => {

  // The middleware who is responsible for the front and back communication.
  const enhancers = applyMiddleware(fromAquedux.aqueduxMiddleware)

  return createStore(rootReducer, {}, enhancers)
}

export default configureStore

/*
```

And you are good to go! For more help you can check out the example/ directory.

You can also check out each package for their API documentation:

* [aquedux-client](https://github.com/winamax/aquedux/blob/master/packages/aquedux-client/README.md)
* [aquedux-server](https://github.com/winamax/aquedux/blob/master/packages/aquedux-server/README.md)

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
