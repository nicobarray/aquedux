import { selectors } from '../../reducers'

export const getFragmentsInfo = store => {
  const queueNames = Object.keys(selectors.queue.listQueues(store.getState()))

  return JSON.stringify({
    fragments: queueNames.map(name => ({
      name,
      index: Math.floor(
        selectors.queue.getCursor(store.getState(), name) / selectors.queue.getQueueLimit(store.getState())
      )
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
