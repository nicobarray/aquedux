import { selectors } from '../../reducers'

export const getTanksInfo = store => {
  const tanks = selectors.tank.listAll(store.getState())
  return JSON.stringify(tanks)
}

export default store => (req, res) => {
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(getTanksInfo(store))
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message }))
  }
}
