import express, { Application, Request, Response } from 'express';
import { router } from './api/router';
import { config } from './core/config';
import { getServerDomain } from './utils/ngrokUtils';

export const createApp = (): Application => {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/', async (_req: Request, res: Response) => {
        const currentNgrokURL = await getServerDomain();
        res.json({
            "message": "Teler OPENAI Bridge is running", 
            "status": "healthy",
            "server_domain": currentNgrokURL
        });
    });

    app.get('/health', (_req: Request, res: Response) => {
        res.json({
            "status": "healthy", 
            "service": "teler-openai-bridge"}
        )
    })

    app.get('/ngrok-status', async (_req: Request, res: Response) => {
        const currentNgrokURL = await getServerDomain();
        res.json({
            "ngrok_running": currentNgrokURL ?? false,
            "current_ngrok_url": currentNgrokURL ? `https://${currentNgrokURL}` : false,
            "server_domain": config.serverDomain
        })
    })

    app.use('/api', router);

    return app;
};