// backend/models/levelTest.js
module.exports = (sequelize, DataTypes) => {
  const LevelTest = sequelize.define(
    'LevelTest',
    {
      level_test_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER, // users.user_id와 타입/부호 동일하게!
        allowNull: false,
      },
      answers: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      assigned_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'level_tests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  LevelTest.associate = (models) => {
    if (models.User) {
      LevelTest.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  };

  return LevelTest;
};
