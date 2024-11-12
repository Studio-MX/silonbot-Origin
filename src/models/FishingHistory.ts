import {Model, DataTypes} from 'sequelize';
import {sequelize} from '../../sequelize';

export class FishingHistory extends Model {
    declare id: number;
    declare userId: string;
    declare channelId: string;
    declare fishName: string;
    declare fishType: string;
    declare fishRate: string;
    declare length: number;
    declare price: number;
    declare caughtAt: Date;
}

FishingHistory.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        channelId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fishName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fishType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fishRate: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        length: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        caughtAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'FishingHistories',
        timestamps: true,
    },
);
