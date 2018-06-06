import http from 'http'
import { applyMiddleware } from 'redux'

import { createAquedux, createStore, close } from '../src'

const counterReducer = (prevState = 0, action) => {
  const { type } = action
  if (type === 'inc') {
    return prevState + 1
  } else if (type === 'dec') {
    return prevState - 1
  } else {
    return prevState
  }
}

function once() {
  let time = 0
  return function(test) {
    if (time > 1) {
      return
    }
    test()
    time++
  }
}

describe('public api', () => {
  let store = null
  let aquedux = null
  let httpServer = null

  it('should instantiate a working middleware', () => {
    const testMiddleware = _store => next => action => {
      once(() => expect(action.type).toBe('inc'))
      next(action)
      once(() => expect(action.type).toBe('inc'))
    }

    httpServer = http.createServer()
    aquedux = createAquedux({}, httpServer)
    store = createStore(counterReducer, applyMiddleware(aquedux, testMiddleware))

    store.dispatch({ type: 'inc' })
  })

  afterEach(() => {
    if (store) {
      store.dispatch(close())
    }

    if (httpServer) {
      httpServer.close()
    }

    httpServer = null
    aquedux = null
    store = null
  })
})
