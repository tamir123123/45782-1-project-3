import { Sequelize } from 'sequelize-typescript';
import path from 'path';

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'vacations',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  models: [path.join(__dirname, '../models')],
  logging: false,
});

export default sequelize;
