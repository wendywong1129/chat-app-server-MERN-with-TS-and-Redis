import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import 'express-async-errors';
import { config } from '@root/config';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import applicationRoutes from '@root/routes';
import { IErrorResponse, CustomError } from '@global/helpers/error-handler';
import Logger from 'bunyan';
import { SocketIOPostHandler } from '@socket/post';
import { SocketIOFollowerHandler } from '@socket/follower';
import { SocketIOUserHandler } from '@socket/user';

const SERVER_PORT = 5005;

const log: Logger = config.createLogger('setupServer');

export class ChattyServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        // keys: ["test1", "test2"],
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 7 * 24 * 3600000,
        // secure: false,
        secure: config.NODE_ENV !== 'development'
        // sameSite: "none", // comment this line when running the server locally
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        // origin: "*",
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }

  private routesMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    // Handling URLS that does not exist
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      // console.log(error);
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  // private startServer(app: Application): void {}
  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      // console.log(error);
      log.error(error);
    }
  }

  // private createSocketIO(httpServer: http.Server): void {
  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    // console.log(`Worker with process id of ${process.pid} has started...`);
    log.info(`Worker with process id of ${process.pid} has started...`);
    httpServer.listen(SERVER_PORT, () => {
      // console.log(`Server is running on port ${SERVER_PORT}`);
      log.info(`Server is running on port ${SERVER_PORT}`);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private socketIOConnections(io: Server): void {
    // log.info('socketIOConnections');
    const postSocketHandler: SocketIOPostHandler = new SocketIOPostHandler(io);
    const followerSocketHandler: SocketIOFollowerHandler = new SocketIOFollowerHandler(io);
    const userSocketHandler: SocketIOUserHandler = new SocketIOUserHandler(io);
    // const chatSocketHandler: SocketIOChatHandler = new SocketIOChatHandler(io);
    // const notificationSocketHandler: SocketIONotificationHandler = new SocketIONotificationHandler();
    // const imageSocketHandler: SocketIOImageHandler = new SocketIOImageHandler();

    postSocketHandler.listen();
    followerSocketHandler.listen();
    userSocketHandler.listen();
    // chatSocketHandler.listen();
    // notificationSocketHandler.listen(io);
    // imageSocketHandler.listen(io);
  }
}
