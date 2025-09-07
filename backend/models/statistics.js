// backend/models/statistics.js
module.exports = (sequelize, DataTypes) => {
  const Statistics = sequelize.define(
    'Statistics',
    {
      stat_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      period_type: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
        allowNull: false,
      },
      period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      problems_solved: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      problems_attempted: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      correct_submissions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_submissions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      time_spent_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      streak_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      detailed_stats: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('detailed_stats');
          return value ? JSON.parse(value) : {};
        },
        set(value) {
          this.setDataValue('detailed_stats', JSON.stringify(value));
        }
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
      tableName: 'statistics',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['period_type'] },
        { fields: ['period_start'] },
        { fields: ['period_end'] },
      ],
    }
  );

  Statistics.associate = (models) => {
    // User와의 관계
    Statistics.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return Statistics;
};