import localStorage from 'local-storage'

let ls = global.localStorage
if (ls == null) {
  ls = {
    getItem: localStorage,
    setItem: localStorage
  }
}

export default ls
