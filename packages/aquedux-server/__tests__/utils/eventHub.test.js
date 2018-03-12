import { register, unregister, raise, clear, eventMap } from '../../src/utils/eventHub'

// Data for testing.

let data = {}

const callbackFoo = () => 'foo'
const callbackBar = () => 'bar'
const addToData = (key, value) => args => (data[key] = value)

beforeEach(() => {
  clear()
  data = {}
})

/* Test clear() */

test('clear is defined', () => {
  expect(typeof clear).toBe('function')
})

test('clear all callbacks', () => {
  expect(eventMap).toEqual({})
  register('foo', callbackFoo)
  register('bar', callbackFoo)
  register('baz', callbackFoo)
  clear()
  expect(eventMap).toEqual({})
})

/* Test register() */

test('register is defined', () => {
  expect(typeof register).toBe('function')
})

test('register add new callback', () => {
  expect(eventMap).toEqual({})
  register('foo', callbackFoo)
  expect(eventMap).toEqual({
    foo: [callbackFoo]
  })
})

test('register add same callback twice', () => {
  expect(eventMap).toEqual({})
  register('foo', callbackFoo)
  register('foo', callbackFoo)
  expect(eventMap).toEqual({
    foo: [callbackFoo, callbackFoo]
  })
})

/* Test unregister() */

test('unregister is defined', () => {
  expect(typeof unregister).toBe('function')
})

test('unregister removes a callback', () => {
  expect(eventMap).toEqual({})
  register('foo', callbackFoo)
  register('foo', callbackBar)
  expect(eventMap).toEqual({
    foo: [callbackFoo, callbackBar]
  })
  unregister('foo', callbackFoo)
  expect(eventMap).toEqual({
    foo: [callbackBar]
  })
})

test('unregister of an event with a single callback remove the event field', () => {
  expect(eventMap).toEqual({})
  register('foo', callbackFoo)
  expect(eventMap).toEqual({ foo: [callbackFoo] })
  unregister('foo', callbackFoo)
  expect(eventMap).toEqual({})
})

test('unregister removes all duplicate callbacks of a given event name', () => {
  expect(eventMap).toEqual({})
  register('foo', callbackFoo)
  register('foo', callbackFoo)
  expect(eventMap).toEqual({ foo: [callbackFoo, callbackFoo] })
  unregister('foo', callbackFoo)
  expect(eventMap).toEqual({})
})

test('unregister non-registered callback does nothing', () => {
  expect(eventMap).toEqual({})
  unregister('foo', callbackFoo)
  expect(eventMap).toEqual({})
})

/* Test raise() */

test('raise is defined', () => {
  expect(typeof raise).toBe('function')
})

test('raise an event without any registered callbacks does nothing', () => {
  expect(eventMap).toEqual({})
  expect(data).toEqual({})
  raise('foo', null)
  expect(data).toEqual({})
})

test('raise an event with one callback', () => {
  const callback = addToData('foo', 'bar')
  register('foo', callback)
  expect(eventMap).toEqual({ foo: [callback] })
  expect(data).toEqual({})
  raise('foo', null)
  expect(data).toEqual({ foo: 'bar' })
})

test('raise an event with two callback', () => {
  const callbackA = addToData('foo', 'bar')
  const callbackB = addToData('full', 'metal')
  register('foo', callbackA)
  register('foo', callbackB)
  expect(data).toEqual({})
  raise('foo', null)
  expect(data).toEqual({ foo: 'bar', full: 'metal' })
})

test('raise forward arguments to callback', () => {
  const callbackA = args => {
    data['foo'] = args
  }
  register('foo', callbackA)
  expect(data).toEqual({})
  raise('foo', 'bar')
  expect(data).toEqual({ foo: 'bar' })
})
