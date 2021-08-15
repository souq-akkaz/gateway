import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';

import config from './config/config';
import { applyMiddlewareExcludeRoutes } from './core/exclude-routes';
import requireAuth from './middlewares/auth.middleware';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config({ path: process.env.NODE_ENV == 'production' ? '.env' : 'dev.env' });

const onProxyError = (err: Error | any, req: Request, res: Response, target: string): void => {
  console.error(err);
  if (err.code && err.code == 'ECONNRESET') {
    res
      .status(500)
      .send({
        message: 'upstream server timeout',
        code: err.code,
        id: 'errors.gateway.upstreamTimeout'
      });
    return;
  } else if (err.code && err.code == 'ECONNREFUSED') {
    res
      .status(503)
      .send({
        message: 'upstream server down',
        code: err.code,
        id: 'errors.gateway.upstreamDown'
      });
    return;
  }
  res.status(500).send(err);
};

const bootstrap = async () => {
  const app = express();

  app.use(cors());
  app.disable('x-powered-by');
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet.noSniff());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.contentSecurityPolicy());
  app.use(compression());

  app.get('/health', (req, res) => res.json({ healthy: true }));

  app.use(applyMiddlewareExcludeRoutes(requireAuth, config.authExcludeRoutes));

  app.use('/store/health', createProxyMiddleware({
    target: `${process.env.STORE_URL}/health`,
    pathRewrite: {
      '^/store/health': ''
    },
    logLevel: 'debug'
  }));
  app.use('/store/v1*', createProxyMiddleware({
    target: `${process.env.STORE_URL}/api/v1`,
    onError: onProxyError,
    pathRewrite: {
      '^/store/v1': ''
    },
    logLevel: 'debug'
  }))

  app.listen(
    config.port,
    () => console.log(`app listening on port ${config.port}`)
  );
};

bootstrap();
