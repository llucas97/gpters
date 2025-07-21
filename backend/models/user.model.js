const bcrypt = require("bcrypt");

// models/user.model.js 예시
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING,
    },
    provider: {
      type: DataTypes.ENUM('local', 'google', 'kakao', 'github'),
      defaultValue: 'local',
    },
    provider_id: {
      type: DataTypes.STRING,
    },
    profile_image_url: {
      type: DataTypes.TEXT,
    },
    current_level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    experience_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    survey_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_login: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: false,
  });
User.associate = (models) => {
  User.hasOne(models.Survey, {
    foreignKey: 'user_id',
    as: 'survey',
  });
};

  return User;
};

