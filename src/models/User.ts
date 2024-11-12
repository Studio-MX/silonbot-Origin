import {Model, DataTypes} from 'sequelize';
import {sequelize} from '../../sequelize';
export class User extends Model {
    declare id: string;
    declare username: string;
    declare fishCaught: number;
    declare money: number;
    declare totalAssets: number;
}
User.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fishCaught: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        money: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        totalAssets: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'Users',
    },
);
