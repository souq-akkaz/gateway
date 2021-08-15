import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

interface IDecoded {
  currentUserId: number;
  username: string;
  iat: number;
  exp: number;
}

const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  let token = req.headers.authorization;
  if (!token) {
    res.status(401).json({
      id: 'errors.gateway.requiredAuth.noTokenProvided',
      message: 'No token provided',
      code: 'NTKP__QEE'
    });
    return;
  }
  token = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as IDecoded;
    req.headers['x-user-id'] = decoded.currentUserId.toString();
    console.log(`set x-user-id with value ${decoded.currentUserId} and call next()`);
    next();
  } catch (exc) {
    if (exc instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        id: 'errors.gateway.requiredAuth.expiredToken',
        message: 'Token is expired',
        code: 'TKEXPP__XD'
      });
      return;
    }
    if (exc instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        id: 'errors.gateway.requiredAuth.invalidToken',
        message: 'Token is invalid',
        code: 'TKINVV_889'
      });
      return;
    }
    console.error(exc);
    res.status(501).json({
      id: 'errors.gateway.requriedAuth.unkownError',
      message: 'UNKNOWN ERROR',
      code: 'UNKOWN_ERROR',
      error: exc
    });
    return;
  }
};

export default requireAuth;
