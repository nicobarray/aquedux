const until = async condition =>
  new Promise(resolve => {
    const before = Date.now()
    let intId = setInterval(() => {
      if (condition) {
        clearInterval(intId)
        resolve(Date.now() - before)
      }
    }, 50)
  })

export default until
