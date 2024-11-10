import {Model, DataTypes} from 'sequelize';
import {sequelize} from '../sequelize';
export class FishingSpot extends Model {}
FishingSpot.init(
    {
        channelId: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        reputation: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        cleanliness: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        fee: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        terrain: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: true,
        },
        minPurchasePrice: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        ownerId: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        isPurchaseDisabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        facilities: {
            type: DataTypes.STRING,
            get() {
                const facilities = this.getDataValue('facilities');
                return facilities ? facilities.split(',') : [];
            },
            set(val) {
                this.setDataValue('facilities', val.join(','));
            },
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'FishingSpot',
    },
);
