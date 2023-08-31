import express, { Express } from 'express';
import { ChattyServer } from './setupServer';
import databaseConnection from './setupDatabase';
import { config } from './config';

class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app);
    server.start();
    // Application.handleExit();
  }

  private loadConfig(): void {
    config.validateConfig();
    // config.cloudinaryConfig();
  }
}

const application: Application = new Application();
application.initialize();
