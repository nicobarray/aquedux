// @flow

const getsetLatestFragmentIndexAsync = async (connection: any, name: string) => {
  const metaName = `${name}-head`
  const queueLength = await connection.getAsync([metaName])
  if (!queueLength) {
    await connection.setAsync([metaName, 0])
  }
  return parseInt(queueLength, 10) || 0
}

export default getsetLatestFragmentIndexAsync
