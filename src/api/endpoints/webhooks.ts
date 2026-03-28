import { Router, Request, Response } from 'express';

export const webhookRouter = Router();

webhookRouter.post('/receiver', (req: Request, res: Response) => {
    const data = req.body;
    console.info("--------Webhook Payload--------");
    console.info(JSON.stringify(data, null, 2));

    res.send({ msg: "Received webhooks" })
});