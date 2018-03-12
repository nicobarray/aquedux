// @flow

type InternalState = {
  reduceStateToQueueSnapshot: ?(any) => any
}

const internalState: InternalState = {
  reduceStateToQueueSnapshot: null
}

const setReduceStateToQueueSnapshot = (cb: any => any) => {
  internalState.reduceStateToQueueSnapshot = cb
}

const reduceStateToQueueSnapshot = (prevState: any): any => {
  if (!internalState.reduceStateToQueueSnapshot) {
    return prevState
  }
  return internalState.reduceStateToQueueSnapshot(prevState)
}

export default {
  setReduceStateToQueueSnapshot,
  reduceStateToQueueSnapshot
}
