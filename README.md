# <img src='https://user-images.githubusercontent.com/4137761/37289440-f7a26b68-2609-11e8-8c23-fb8b49c53c90.png' height='60'>
> Aquedux over the wire


[![CI Status](https://circleci.com/gh/winamax/aquedux.svg?style=shield)](https://circleci.com/gh/winamax/aquedux)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

To synchronise a React app, you would either use a REST or GraphQL API. It means that you have to handle the hassle to transform your Redux action into understandable payloads for the server API to comprehense. Moreover, when the server API sends it response back, you have to translate the payload into a Redux action and dispatch it. No one should
have to do that.

With Aquedux, you simply share the reducer code across the client and
the server app, describe channels which transport the Redux actions and "Voila!".

It makes write client(s)/server applications easy without adding another layer by leveraging the elegant design of Redux.

For more informations, see *How Aquedux Works* bellow.

# Installation

To install the latest version, clone the repository:
- On branch master for the latest stable release
- On branch develop for the latest features

Then you have to build and link the project to use it localy:

```sh
yarn && yarn link
```

Once the package is build and linked, change to your project directory\
and run:

```sh
yarn link aquedux-server
```

You are good to go!

# Usage

To provide this transparency of use, you have to setup aquedux-server in a few files:

- 1) Add the redux middleware `aqueduxMiddleware` on store creation.
- 2) Combine the `aqueduxReducers`on store creation.
- 3) Configure the aquedux runtime with `createAqueduxServer`. In this step you describe how the channels are used.

Here you have a simple setup example.

```js
// Some createStore.js file.

import { createStore, applyMiddleware, combineReducers } from 'redux'
import {
    createAqueduxServer,
    aqueduxReducers,
    aqueduxMiddleware,
    onAquedux
} from 'aquedux-server'
import reduxThunk from 'redux-thunk'
import { createLogger } from 'redux-logger'

import appReducers from './path/to/app/reducers'


// ------ The Redux store step.

const enhancers = applyMiddleware(
    // Some common middlewares...
    reduxThunk,
    createLogger(),
    // 1) The aquedux middleware
    aqueduxMiddleware
)

// The store initial state
const initialState = { /* ... */ }

const rootReducer = combineReducers({
    appReducers,
    // 2) Combine the aquedux reducers with the app reducers
    aqueduxReducers
})

const store = createStore(rootReducer, initialState, enhancers)

// ------ The Aquedux server step.

const aquedux = createAqueduxServer(store)

/* 3) Before starting the server we have to configure the channels
** though which our Redux actions will travel to (and from) the aquedux
** server.
**
** The server channel definition must map the aquedux-client you have defined.
** This means that you have to define one add{Template}?Channel on the server-side.
**
** For more in depth explaination of channels, see *How Aquedux Works* bellow.
*/

/* The addChannel method takes 4 arguments.
** - The channel name used by components when they subscribe to a channel.
** - A reducer that transform the current state into a snapshot. See *How Aquedux Works* bellow for more details.
** - A matching pattern for the Redis queue that will store all actions that used this channel.
*/
aquedux.addChannel(
'message',
action => actionTypes.tournament.hasOwnProperty(action.type),
(getState, ignored) => getState().entities.messages,
'tournament-*'
)

/* This version of addChannel takes the action parameter of the subscribe action into account.
** See *How Aquedux Works* bellow for more details.
*/
server.addChannelTemplate(
    'user-message',
    ({ uid }) => action => action.uid === uid && actionTypes.hasOwnProperty(action.type),
    (getState, { tid }) => getState().entities.messages.find(msg => msg.uid === uid)
)

aquedux.setStatefullTypes(/* An array of action types to persist on Redis. */)

/* Here specify the aquedux-server listening port.*/
const host = 'localhost'
const port = '3001'

aquedux.start(host, port)

// Now you can dispatch an action wrapped with the onAquedux function.
// If the action match any channel criteria, it will be sent to every connected client that have subscribed to those channels.
store.dispatch(onAquedux({ type: 'SEND_MESSAGE', payload: { message: 'Hello World!' }}))

```

# How Aquedux Works ?

FIXME: To complete.