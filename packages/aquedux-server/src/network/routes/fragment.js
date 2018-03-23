import configManager from '../../managers/configManager'
import { selectors } from '../../reducers'

export default (store, route) => (req, res) => {
  const { queueLimit } = configManager.getConfig()
  const channelName = req.url.substr((route + '/fragments/').length)
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    const cursor = selectors.queue.getCursor(store.getState(), channelName)
    const fragmentIndex = queueLimit === 0 ? 0 : Math.floor(cursor / queueLimit)
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
