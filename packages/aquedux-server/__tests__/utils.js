export async function waitFor(seconds) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

export async function until(test, timeout = 5000) {
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
  return function(test) {
    if (time > 1) {
      return
    }
    test()
    time++
  }
}
