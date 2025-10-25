module.exports = (sequelize, DataTypes) => {
  const ProblemEvaluation = sequelize.define('problem_evaluations', {
  evaluation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  problem_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'problem_id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_reported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  report_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'problem_evaluations',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'problem_id'],
      name: 'unique_user_problem_eval'
    }
  ]
});

return ProblemEvaluation;
};

