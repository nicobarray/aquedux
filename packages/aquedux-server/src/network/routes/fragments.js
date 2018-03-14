import configManager from '../../managers/configManager'
import { selectors } from '../../reducers'

const { queueLimit } = configManager.getConfig()

export const getFragmentsInfo = store => {
  const queueNames = Object.keys(selectors.queue.listQueues(store.getState()))
  const cursor = selectors.queue.getCursor(store.getState(), channelName)
  const index = queueLimit === 0 ? cursor : Math.floor(cursor / queueLimit)

  return JSON.stringify({
    fragments: queueNames.map(name => ({
      name,
      index
    }))
  })
}

export default store => (req, res) => {
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(getFragmentsInfo(store))
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message }))
  }
}
