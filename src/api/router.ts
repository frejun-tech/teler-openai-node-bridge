import { Router } from 'express';
import { callRouter } from './endpoints/calls';
import { webhookRouter } from './endpoints/webhooks';

export const router = Router();

router.use('/v1/calls', callRouter);
router.use('/v1/webhooks', webhookRouter);