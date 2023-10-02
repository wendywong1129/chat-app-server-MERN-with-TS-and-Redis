import mongoose from 'mongoose';
import { config } from '@root/config';
import Logger from 'bunyan';
import { redisConnection } from '@service/redis/redis.connection';

const log: Logger = config.createLogger('setupDatabase');

export default () => {
  const connect = () => {
    mongoose
      .connect(`${config.DATABASE_URL}`)
      .then(() => {
        // console.log("Successfully connected to database.");
        log.info('Successfully connected to database.');
        redisConnection.connect();
      })
      .catch((error) => {
        // console.log("Error connecting to database", error);
        log.error('Error connecting to database', error);
        return process.exit(1);
      });
  };
  connect();

  mongoose.connection.on('disconnected', connect);
};
