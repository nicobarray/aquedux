import { selectors } from '../../reducers'

export const getChannelsInfo = store => {
  const channels = selectors.channels.listAll(store.getState())
  return JSON.stringify(channels)
}

export default store => (req, res) => {
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(getChannelsInfo(store))
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message }))
  }
}
