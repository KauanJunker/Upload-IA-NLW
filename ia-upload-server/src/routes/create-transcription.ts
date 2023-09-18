import { FastifyInstance } from 'fastify'
import { createReadStream, createWriteStream } from 'node:fs'
import { z } from 'zod'
import { prisma } from '../libs/prisma'
import { openAI } from '../libs/openai'

export async function createTranscriptionRoute(app: FastifyInstance ) {
  app.post('/videos/:videoId/transcription', async (req) => {

    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    })

    const { videoId } = paramsSchema.parse(req.params)

    const bodySchema = z.object({
      prompt: z.string(),
    })

    const { prompt } = bodySchema.parse(req.body)

    const video = await prisma.video.findFirstOrThrow({
      where: {
        id: videoId,
      }
    })

    const videoPath = video.path
    const audioReadStream = createReadStream(videoPath)

    const response = await openAI.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0,
      prompt,
    })

    const transcription = response.text

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        transcription,
      }
    })

    return { transcription }
  })
}