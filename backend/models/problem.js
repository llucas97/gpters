// backend/models/problem.js
module.exports = (sequelize, DataTypes) => {
  const Problem = sequelize.define(
    'Problem',
    {
      problem_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      difficulty_level: {
        type: DataTypes.ENUM('beginner', 'easy', 'medium', 'hard', 'expert'),
        allowNull: false,
        defaultValue: 'easy',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      input_format: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      output_format: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      constraints: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sample_input: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sample_output: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      time_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1000,
        comment: '시간 제한 (ms)',
      },
      memory_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 256,
        comment: '메모리 제한 (MB)',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '문제 태그들',
      },
      solution_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '해결한 사용자 수',
      },
      total_submissions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '총 제출 수',
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
      tableName: 'problems',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['difficulty_level'] },
        { fields: ['category'] },
        { fields: ['created_at'] },
      ],
    }
  );

  Problem.associate = (models) => {
    // User와의 관계는 submissions 테이블을 통해 연결될 예정
    // if (models.Submission) {
    //   Problem.hasMany(models.Submission, {
    //     foreignKey: 'problem_id',
    //     as: 'submissions',
    //   });
    // }
  };

  return Problem;
};