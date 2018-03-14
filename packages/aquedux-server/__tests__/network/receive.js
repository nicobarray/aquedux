import jwt from 'jsonwebtoken'

import configManager from '../../src/managers/configManager'

import receive from '../../src/network/receive'
import logger from '../../src/utils/logger'

// Data for testing.

const { secret } = configManager.getConfig()

const mockTank = {
  conn: {
    id: 'foo'
  }
}

const mockDispatch = testOnAction => action => {
  testOnAction(action)
}

const meta = { foo: 'bar' }
const fakeAction = {
  type: 'foo',
  token: jwt.sign(meta, secret)
}

let streams

beforeAll(() => {
  streams = logger.streams
  logger.streams = []
})

afterAll(() => {
  logger.streams = streams
})

/* test receive() */

test('receive is defined', () => {
  expect(receive).toBeDefined()
})

test('receive remove the token property before dispatching', () => {
  const tank = mockTank
  const dispatch = mockDispatch(action => {
    expect(action.token).toBeUndefined()
  })

  receive(dispatch, tank, fakeAction)
})

test('receive add the meta property before dispatching', () => {
  const tank = mockTank
  const dispatch = mockDispatch(action => {
    expect(action.meta).toBeDefined()
  })

  receive(dispatch, tank, fakeAction)
})

test("receive should unpack action's token property as a meta property", () => {
  const tank = mockTank
  const dispatch = mockDispatch(action => {
    expect(action.meta).toBeDefined()
    expect(action.meta.foo).toBe(meta.foo)
  })
  receive(dispatch, tank, fakeAction)
})

test('receive verify the token correctly', () => {
  const tank = mockTank
  const dispatch = mockDispatch(action => {
    expect(action.meta).toBeDefined()
    const token = jwt.sign(action.meta, secret)
    expect(token).toBe(fakeAction.token)
  })
  receive(dispatch, tank, fakeAction)
})
