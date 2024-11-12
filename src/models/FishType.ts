import {Model, DataTypes} from 'sequelize';
import {sequelize} from '../../sequelize';

export class FishType extends Model {
    declare id: number;
    declare name: string;
    declare chance: number;
    declare price: number;
    declare length: number;
    declare type: 'trash' | 'fish' | 'dino';
    declare rate: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ultra-legendary';
    declare terrain: number;
}
FishType.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        chance: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        length: {
            type: DataTypes.INTEGER,
        },
        type: {
            type: DataTypes.ENUM('trash', 'fish', 'dino'),
        },
        rate: {
            type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra-legendary'),
        },
        terrain: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'FishType',
        tableName: 'FishTypes',
        timestamps: false,
    },
);