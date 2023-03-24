import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import fse from 'fs-extra'
import fs from 'node:fs'
import { combineStreams } from './mergeStream.js'
import { streamToBuffer } from './streamToBuffer.js'
import { bufferToStream } from './bufferToStream.js'

const getUploadFilename = (uid, name = '') => {
  return path.resolve(process.cwd(), 'tmp/uploads', uid, name)
}

const getUploadDir = () => {
  const uid = uuidv4().slice(0, 5)
  const dir = getUploadFilename(uid)

  fse.ensureDirSync(dir)

  return {
    dir,
    uid
  }
}

const app = express()

app.use(cors())
app.use(express.raw({
  type: 'application/offset+octet-stream'
}))
app.use(express.json())
app.use(express.text())

// 1. 创建存放上传文件的临时文件夹，返回 uid
app.post("/upload", function(req, res){
  console.log("BEGIN /upload");
  
  const { uid } = getUploadDir()
  
  res.status(200).send(uid)
})

// 2. 将文件块合并生成原始文件
app.patch("/upload", (req, res) => {
  const { patch } = req.query
  const file = req.body
  const filename = req.get('upload-name')
  const fileLength = Number.parseInt(req.get('upload-length'))
  const filepath = getUploadFilename(patch, filename)

  const resJson = {
    data: {
      filepath,
      filename,
      complete: false
    },
    message: 'ok',
    code: 200
  }

  // 检查
  fs.access(filepath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`${filepath} ${err ? 'does not exist' : 'exists'}`);
      fse.outputFileSync(filepath, file)
      res.status(200).json(resJson)

      return
    }

    const stream1 = fs.createReadStream(filepath)
    const stream2 = bufferToStream(file)
   
    const mergedStream = combineStreams([stream1, stream2])

    streamToBuffer(mergedStream).then(mergedBuffer => {
      fse.outputFileSync(filepath, mergedBuffer)

      console.log(mergedBuffer.length);

      if (mergedBuffer.length >= fileLength) {

        console.log('upload complete')
        
        resJson.data.complete = true

        res.status(200).json(resJson)

      } else {
        res.status(200).json(resJson)
      }

      
    })

  })

  


})

// 删除文件
app.delete("/upload", (req, res) => {
  const uid = req.body

  console.log('you can delete the file which uid is', uid);

  res.status(200).send('ok')
})

app.listen(3000)