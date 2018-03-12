import type { Connection } from 'sockjs'

// @flow

type InternalState = {
  tanks: {
    [string]: {
      conn: Connection,
      id: string
    }
  }
}

const internalState: InternalState = {
  tanks: {}
}

const addSocket = (tankId: string, conn: Connection): void => {
  if (internalState.tanks.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} is already connected.`)
  }
  internalState.tanks[tankId] = {
    id: tankId,
    conn
  }
}

const removeSocket = (tankId: string): void => {
  if (!internalState.tanks.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} does not exists. You forgot to add its sockJS connection?`)
  }
  const { [tankId]: removed, ...otherTanks } = internalState.tanks
  internalState.tanks = otherTanks
  return removed
}

const getSocket = (tankId: string): Connection => {
  if (!internalState.tanks.hasOwnProperty(tankId)) {
    throw new Error(`Tank ${tankId} does not exists. You forgot to add its sockJS connection?`)
  }
  const { [tankId]: tank } = internalState.tanks
  return tank.conn
}

const listAll = (): Array<{ id: string, conn: Connection }> =>
  Object.keys(internalState.tanks).map(key => internalState[key])

export default {
  addSocket,
  removeSocket,
  getSocket,
  listAll
}

export const kickTank = tankId => {
  try {
    const tank = removeSocket(tankId)
    tank.conn.close()
  } catch (err) {}
}
