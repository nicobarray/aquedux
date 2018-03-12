const until = async condition =>
  new Promise((resolve, reject) => {
    const before = Date.now()
    let intId = setInterval(() => {
      if (condition) {
        clearInterval(intId)
        resolve(Date.now() - before)
      }
    }, 50)
  })

export default until
