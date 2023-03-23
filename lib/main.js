import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { ensureDirSync } from 'fs-extra'

const getUploadDir = () => {
  const uid = uuidv4().slice(0, 5)
  const dir = path.resolve(process.cwd(), 'tmp/uploads', uid)

  ensureDirSync(dir)

  return {
    dir,
    uid
  }
}

const app = express()

app.use(cors())

app.post("/upload", function(req, res){
  console.log("BEGIN /upload");
  
  const {uid} = getUploadDir()
  
  res.status(200).send(uid)
})

app.listen(3000)