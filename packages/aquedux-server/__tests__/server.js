import http from 'http'
import { applyMiddleware } from 'redux'

import redis from 'redis'
import bluebird from 'bluebird'

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

// Public api
import { createAquedux, createStore, close } from '../src'

// Private
import configManager from '../src/managers/configManager'
import channelManager from '../src/managers/channelManager'
import tankManager from '../src/managers/tankManager'
import queueManager from '../src/managers/queueManager'

const counterReducer = (prevState = 0, action) => {
  const { type } = action
  if (type === 'counter/inc') {
    console.log('inc in reducer', prevState, action)
    return prevState + 1
  } else if (type === 'counter/dec') {
    return prevState - 1
  }

  return prevState
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

let port = 9000
let store = null
let aquedux = null
let httpServer = null
let redisClient = null

function nextPort() {
  port++
  return port
}

const waitFor = async seconds => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

const until = async (test, timeout = 5000) => {
  let truthy = false
  let success = true
  let timeoutHandle = setTimeout(() => (success = false), timeout)

  while (!truthy || !success) {
    await waitFor(1)
    truthy = test()
  }

  clearTimeout(timeoutHandle)
  return success
}

beforeAll(async () => {
  redisClient = redis.createClient()
  // await redisClient.selectAsync(7)
})

beforeEach(async () => {
  await redisClient.flushdbAsync()
})

afterEach(() => {
  if (store) {
    store.dispatch(close())
  }

  if (httpServer) {
    httpServer.close()
  }

  configManager.clear()
  tankManager.clear()
  channelManager.clear()
  queueManager.clear()

  httpServer = null
  aquedux = null
  store = null
})

afterAll(async () => {
  await redisClient.quitAsync()
})

// describe('public api', () => {
//   it('should instantiate a working middleware', () => {
//     const testMiddleware = _store => next => action => {
//       once(() => expect(action.type).toBe('inc'))
//       next(action)
//       once(() => expect(action.type).toBe('inc'))
//     }

//     aquedux = createAquedux({
//       port: nextPort()
//     })
//     store = createStore(counterReducer, applyMiddleware(aquedux, testMiddleware))

//     store.dispatch({ type: 'inc' })
//   })

//   it('should instantiate a working middleware with an external httpServer', () => {
//     const testMiddleware = _store => next => action => {
//       once(() => expect(action.type).toBe('inc'))
//       next(action)
//       once(() => expect(action.type).toBe('inc'))
//     }

//     httpServer = http.createServer()
//     aquedux = createAquedux(
//       {
//         host: nextPort()
//       },
//       httpServer
//     )
//     store = createStore(counterReducer, applyMiddleware(aquedux, testMiddleware))

//     store.dispatch({ type: 'inc' })
//   })
// })

describe('channel', () => {
  // it('should define a channel', () => {
  //   const channels = ['counter', 'foo', 'bar', 'baz']
  //   aquedux = createAquedux({
  //     port: nextPort(),
  //     channels
  //   })
  //   store = createStore(counterReducer, applyMiddleware(aquedux))

  //   channels.forEach(channel => expect(channelManager.hasChannel(channel)).toBeTruthy())
  // })

  it('should load a channel on first subscribe', async () => {
    /**
     * The test setup.
     *
     * Populate a redis database with a fake queue.
     * Create the aquedux server middleware with a counter channel.
     * Create the redux store.
     * Create a fake connected user.
     */

    const inc = JSON.stringify({ type: 'counter/inc' })
    await redisClient.rpushAsync(['counter-frag-0', inc, inc])

    await (async () => {
      const len = await redisClient.lrangeAsync(['counter-frag-0', 0, -1])
      console.log('[CHECK REDIS SETUP', len.map(JSON.parse))
    })()

    aquedux = createAquedux({
      port: nextPort(),
      logLevel: 'debug',
      channels: [
        {
          name: 'counter',
          predicate: ({ type }) => type === 'counter/inc' || type === 'counter/dec',
          reducer: (state, _action) => state
        }
      ]
    })

    expect(channelManager.hasChannel('counter')).toBeTruthy()

    // The counter queue has 2 inc actions.
    // This middleware checks if they are correctly reduced.
    let haveSeenIncAction = 0
    const testMiddleware = _store => next => action => {
      console.log('testMiddleware', action)
      next(action)
      if (action.type === 'counter/inc') {
        haveSeenIncAction++
      }
    }

    store = createStore(counterReducer, applyMiddleware(testMiddleware, aquedux))

    // Add fake connected user.
    const tankId = 'fake-tank'
    const socket = { write: jest.fn() }
    tankManager.addTank(tankId, socket)

    /**
     * The test.
     *
     * Fake a user subscription.
     */
    store.dispatch({
      type: 'AQUEDUX_CLIENT_CHANNEL_JOIN',
      name: 'counter',
      tankId
    })

    /**
     * The test asserts.
     *
     * Wait for the queue to load.
     * Check for the queue state.
     * Check for the fake user state.
     * Check if the snapshot was sent correctly.
     * Check the redux state.
     */

    // Wait for the queue to be available.
    const inTime = await until(() => queueManager.isQueueAvailable('counter'))
    expect(inTime).toBeTruthy()

    expect(tankManager.getTank(tankId).channels).toEqual(['counter'])
    expect(socket.write).toHaveBeenCalled()
    expect(haveSeenIncAction).toBe(2)
    expect(store.getState()).toBe(2)
  })

  // it('should unload a queue when there is no more subscriber', () => {})
})
