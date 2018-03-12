import onAquedux from '../../src/utils/actionWrapper'

// Data for testing.

const action = {
  type: 'foo',
  data: 'bar'
}

/* test onAquedux() */

test('wrapper is pure', () => {
  const arg = action
  const result = onAquedux(action)
  expect(result).not.toEqual(action)
  expect(action).toEqual(arg)
  const result2 = onAquedux(action)
  expect(result2).not.toEqual(action)
  expect(result2).toEqual(result)
})

test('wrapper add AQUA before the type', () => {
  const result = onAquedux(action)
  expect(result).toEqual({
    ...action,
    type: 'AQUA:' + action.type
  })
})

test('wrapper do nothing if the type property is missing', () => {
  const result = onAquedux({ foo: 'bar' })
  expect(result.type).toBeUndefined()
})

test('wrapper do nothing if the action is already wrapped', () => {
  const firstResult = onAquedux(action)
  const lastResult = onAquedux(firstResult)
  expect(firstResult).toEqual(lastResult)
})
