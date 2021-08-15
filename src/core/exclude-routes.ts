import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import R from 'ramda';

export const applyMiddlewareExcludeRoutes = (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  routes: string[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!_.isEmpty(routes)) {
      const route = routes.find((route) => {
        const endsWithStar = R.pipe(
          R.split(''),
          R.last,
          R.equals('*')
        );

        if (endsWithStar(route)) {
          return new RegExp(route, 'g').test(req.path);
        } else {
          return new RegExp(`${route}$`, 'g').test(req.path)
        }
      });
      if (route) {
        console.log(`excluding route  ${route} from middleware ${middleware.name}`);
        next();
        return;
      }
    }

    middleware(req, res, next);
    return;
  };
};