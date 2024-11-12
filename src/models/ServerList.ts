import {Model, DataTypes} from 'sequelize';
import {sequelize} from '../../sequelize';
export class ServerList extends Model {
    declare id: string;
    declare name: string;
}
ServerList.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'ServerLists',
    },
);
