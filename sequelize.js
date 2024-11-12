import {Sequelize} from 'sequelize';

const data = JSON.parse(process.env.DATABASE_URL);

export const sequelize = new Sequelize(...(data[0] ? [...data] : [data]));
