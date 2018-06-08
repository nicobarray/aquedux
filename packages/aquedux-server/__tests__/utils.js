// @flow

import { type Action } from '../src/constants/types'

export async function waitFor(seconds: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

export async function until(test: Function, timeout: number = 5000) {
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

export function once() {
  let time = 0
  return function(test: Function) {
    if (time > 1) {
      return
    }
    test()
    time++
  }
}

export function fakeUserAction(action: Object, tankId: string, serverId: string): Action {
  return {
    ...action,
    meta: {
      ...action.meta,
      tankId,
      serverId
    }
  }
}
