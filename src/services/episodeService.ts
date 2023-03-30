import path from "path"
import fs from "fs";
import { Response } from "express";
import { WatchTime } from "../models";
import { WatchTimeAttributes } from "../models/WatchTime";

export const episodeService = {
    //Metodo para steam dos episodios
    streamEpisodeToResponse: async ( res: Response, videoUrl: string, range: string | undefined) => {
        const filePath = path.join(__dirname, "..", "..", "uploads", videoUrl)
        const fileStat = fs.statSync(filePath)

        if (range) {
            //capturando o inicio e o final da parte especifica do video 
            const parts = range.replace(/bytes=/, '').split('-')

            const start = parseInt(parts[0], 10 ) 
            const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1

            const chunkSize = (end - start) + 1

            const file = fs.createReadStream(filePath,{
                start: start, 
                end: end
            })

            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
                'Accept-Ranges': 'bytes', 
                'Content-Lenght': chunkSize, 
                'Content-Type': 'video/mp4'
            }

            res.writeHead(206, head)
            file.pipe(res)
        } else {
            const head = {
                'Content-Lenght': fileStat.size, 
                'Content-Type': 'video/mp4'
            }

            res.writeHead(200, head)
            fs.createReadStream(filePath).pipe(res)
        }
    },

    //Metodo para recuperar em que momento o episodio parou
    getWatchTime: async (userId: number, episodeId: number) => {
        const watchTime = await WatchTime.findOne({
            attributes: ['seconds'],
            where: {
                userId,
                episodeId
            }
        })

        return watchTime
    },

    //Metodo para salvar os segundos do episodio
    setWatchTime: async ({ userId, episodeId, seconds }: WatchTimeAttributes) => {
        const watchTimeAlreadyExists = await WatchTime.findOne({
            where: {
                userId,
                episodeId
            }
        })

        if (watchTimeAlreadyExists) {
            watchTimeAlreadyExists.seconds = seconds
            await watchTimeAlreadyExists.save()

            return watchTimeAlreadyExists
        } else {
            const watchTime = await WatchTime.create({
                userId,
                episodeId,
                seconds
            })
    
            return watchTime
        }
    }
}