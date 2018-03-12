import { selectors } from '../../reducers'

export default (store, route) => (req, res) => {
  const channelName = req.url.substr((route + '/fragments/').length)
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    const fragmentIndex = Math.floor(
      selectors.queue.getCursor(store.getState(), channelName) / selectors.queue.getQueueLimit(store.getState())
    )
    res.end(
      JSON.stringify({
        fragment: { name: channelName, index: fragmentIndex }
      })
    )
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message }))
  }
}
