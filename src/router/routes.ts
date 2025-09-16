import { Router, Request, Response } from 'express';

const routes = Router();

routes.get('/', async (req: Request, res: Response) => {
  res.send({ status: true, msg: '32 Card 2D Game Testing Successfully 👍' });
});

export { routes };
