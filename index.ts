import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
  _Object,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs, { createReadStream } from 'fs'
import dotenv from 'dotenv'
import { Readable, Stream } from 'stream'

dotenv.config()

const uploadStreamPassthrough = new Stream.PassThrough()

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
  },
  forcePathStyle: true, 
  region: process.env.S3_REGION!, 
})
const s3Bucket = 'app-emea-prod-photo'

export async function getBucketKeysList(key: string): Promise<_Object[]> {
  const response: ListObjectsV2CommandOutput = await s3Client.send(new ListObjectsV2Command({
    Bucket: s3Bucket,
    Delimiter: '/test',
    Prefix: key,
  }))
  return response.Contents || []
}

export async function uploadObject(Key: string) {
  createReadStream('./test.jpg').pipe(uploadStreamPassthrough)
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: s3Bucket,
      Key,
      Body: uploadStreamPassthrough,
    }
  })
  upload.on('httpUploadProgress', (progress) => {
    console.log(`UPLOAD PROGRESS part ${progress.part}:`)
    console.dir(progress)
  })
  return await upload.done();
}

export async function getObjectBuffer(Key: string): Promise<Buffer> {
  const streamToString = (stream: any): Promise<Buffer> =>
    new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });

  const { Body } = await s3Client.send(new GetObjectCommand({
    Bucket: s3Bucket,
    Key,
  }))
  if (!(Body instanceof Readable)) { throw new Error('INVALID_FILE_CONTENT') }
  return await streamToString(Body);
}

export async function getS3SignedKey(Key: string, expiresIn: number): Promise<string> {
  return await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: s3Bucket,
    Key,
  }), {
    expiresIn
  })
}

export async function deleteKey(Key: string): Promise<DeleteObjectCommandOutput> {
  return await s3Client.send(new DeleteObjectCommand({
    Bucket: s3Bucket,
    Key,
  }))
}

const NEW_FILE_KEY = 'test/chunli.jpeg'
async function run() {
  let listBucket = []
  listBucket = await getBucketKeysList('test/')
  console.log('The bucket contains the following...')
  console.dir(listBucket)
  console.log('********************************************************************************')
  console.log(`Uploading a new file with key ${NEW_FILE_KEY}...`)
  const uploadResult = await uploadObject(NEW_FILE_KEY)
  console.dir(typeof uploadResult)
  console.dir(uploadResult)
  console.log(`Uploading success!`)
  console.log('********************************************************************************')
  listBucket = await getBucketKeysList('test/')
  console.log('The bucket now contains the following objects...')
  console.dir(listBucket)
  console.log('********************************************************************************')
  const fileBuffer = await getObjectBuffer(NEW_FILE_KEY)
  const filename = `downloaded-${Date.now()}-${Math.random() * 10}.jpeg`
  fs.writeFileSync(filename, fileBuffer, 'UTF-8');
  console.log(`Copy of file from S3 stored in ${filename}`)
  console.log('********************************************************************************')
  console.log('Generating a public accessible signed key')
  const signedKeyUrl = await getS3SignedKey(NEW_FILE_KEY, 3600)
  console.log(`Signed Key URL is: ${signedKeyUrl}`)
  console.log('********************************************************************************')
  console.log(`deleting '${NEW_FILE_KEY}'...`)
  const deleteResult = await deleteKey(NEW_FILE_KEY)
  console.dir(deleteResult)
  console.log(`Object '${NEW_FILE_KEY}' deleted!`)
}

run()