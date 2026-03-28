import { Router, Request, Response } from "express";
import { getServerDomain } from "../utils/ngrokUtils";
import { config } from "../core/config";

export const systemRouter = Router();

systemRouter.get('/', async (_req: Request, res: Response) => {
    const currentNgrokURL = await getServerDomain();
    res.json({
        "message": "Teler OPENAI Bridge is running", 
        "status": "healthy",
        "server_domain": currentNgrokURL
    });
});

systemRouter.get('/health', (_req: Request, res: Response) => {
    res.json({
        "status": "healthy", 
        "service": "teler-openai-bridge"}
    )
});

systemRouter.get('/ngrok-status', async (_req: Request, res: Response) => {
    const currentNgrokURL = await getServerDomain();
    res.json({
        "ngrok_running": currentNgrokURL ?? false,
        "current_ngrok_url": currentNgrokURL ? `https://${currentNgrokURL}` : false,
        "server_domain": config.serverDomain
    })
});