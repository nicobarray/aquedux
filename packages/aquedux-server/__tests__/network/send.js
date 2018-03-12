import send from '../../src/network/send'
import logger from '../../src/utils/logger'

// Data for testing.

const mockTank = onWrite => ({
  conn: {
    id: 'foo',
    write: onWrite
  }
})

const action = {
  type: 'foo',
  meta: {
    password: 'bar',
    username: 'foo'
  }
}

let streams

beforeAll(() => {
  streams = logger.streams
  logger.streams = []
})

afterAll(() => {
  logger.streams = streams
})

/* test send() */

test('send is defined', () => {
  expect(send).toBeDefined()
})

test('send removed the meta property before sending', () => {
  const tank = mockTank(water => {
    expect(water.meta).toBeUndefined()
  })

  send(tank, action)
})

test('send removed the tankId property before sending', () => {
  const tank = mockTank(water => {
    expect(water.tankId).toBeUndefined()
  })

  send(tank, action)
})

test('send writes a string to the socket and not an object', () => {
  const tank = mockTank(water => {
    expect(typeof water).toBe(typeof 'foo')
  })

  send(tank, action)
})

logger.streams = streams
