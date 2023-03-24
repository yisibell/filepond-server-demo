import { PassThrough } from 'stream'

async function _combineStreams(sources, destination) {
  for (const stream of sources) {
    await new Promise((resolve, reject) => {
      stream.pipe(destination, { end: false })
      stream.on('end', resolve)
      stream.on('error', reject)
    })
  }
  
  destination.emit('end')
}

function combineStreams(streams) {
  const stream = new PassThrough()
  _combineStreams(streams, stream).catch((err) => stream.destroy(err))
  return stream
}

export {
  combineStreams
}

