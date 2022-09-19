import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import express, { Request, Response } from 'express'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hours-string'

const app = express()
const prisma = new PrismaClient()

app.use(express.json())
app.use(cors())

app.get('/ping', (req: Request, res: Response) => {
  res.json({ pong: true })
})

app.get('/games', async (req: Request, res: Response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true
        }
      }
    }
  })

  res.json(games)
})

app.post('/games/:gameId/ads', async (req: Request, res: Response) => {
  const gameId = req.params.gameId
  const body = req.body

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      hourStart: convertHourStringToMinutes(body.hourStart),
      weekDays: body.weekDays.join(','),
      yearsPlaying: body.yearsPlaying,
      useVoiceChannel: body.useVoiceChannel,
      discord: body.discord
    }
  })

  res.status(201).json(ad)
})

app.get('/games/:id/ads', async (req: Request, res: Response) => {
  const gameId = req.params.id

  const ads = await prisma.ad.findMany({
    select: {
      hourStart: true,
      hourEnd: true,
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      game: true
    },
    where: {
      gameId
    },
    orderBy: {
      createAt: 'desc'
    }
  })

  res.json(
    ads.map(ad => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(','),
        hourStart: convertMinutesToHourString(ad.hourStart),
        hourEnd: convertMinutesToHourString(ad.hourEnd)
      }
    })
  )
})

app.get('/ads/:id/discord', async (req: Request, res: Response) => {
  const adId = req.params.id

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true
    },
    where: {
      id: adId
    }
  })

  res.json({
    discord: ad.discord
  })
})

app.listen(process.env.PORT || 4000)
