// backend/models/user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // 소셜 로그인
      provider: {
        type: DataTypes.ENUM('local', 'google', 'kakao', 'github'),
        allowNull: false,
        defaultValue: 'local',
      },
      provider_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      profile_image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // 레벨 및 경험치
      current_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      experience_points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // 설문조사 완료 여부
      survey_completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      // 계정 상태
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // timestamps 매핑
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
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['username'] },
      ],
    }
  );

  // ✅ associate 안에서만 models 접근 (ReferenceError 방지)
  User.associate = (models) => {
    // 설문 1:1
    if (models.Survey) {
      User.hasOne(models.Survey, {
        foreignKey: 'user_id',
        as: 'survey',
      });
    }

    // 레벨테스트 1:N (신규)
    if (models.LevelTest) {
      User.hasMany(models.LevelTest, {
        foreignKey: 'user_id',
        as: 'levelTests',
      });
    }

    // 아래는 선택(모델이 있을 때만 연결) — 원 ERD 기준
    if (models.Submission) {
      User.hasMany(models.Submission, {
        foreignKey: 'user_id',
        as: 'submissions',
      });
    }
    if (models.Attendance) {
      User.hasMany(models.Attendance, {
        foreignKey: 'user_id',
        as: 'attendance',
      });
    }
    if (models.UserLeagueParticipation) {
      User.hasMany(models.UserLeagueParticipation, {
        foreignKey: 'user_id',
        as: 'leagueParticipations',
      });
    }
    if (models.ProblemEvaluation) {
      User.hasMany(models.ProblemEvaluation, {
        foreignKey: 'user_id',
        as: 'problemEvaluations',
      });
    }
    if (models.Payment) {
      User.hasMany(models.Payment, {
        foreignKey: 'user_id',
        as: 'payments',
      });
    }
    if (models.Statistic || models.Statistics) {
      // 프로젝트에 따라 모델명이 Statistic 또는 Statistics일 수 있음
      const StatsModel = models.Statistic || models.Statistics;
      User.hasMany(StatsModel, {
        foreignKey: 'user_id',
        as: 'statistics',
      });
    }
  };

  return User;
};
