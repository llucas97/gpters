'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProblemBank = sequelize.define('ProblemBank', {
    id:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    source:     { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'openai' },
    title:      { type: DataTypes.STRING(255), allowNull: false },
    level:      { type: DataTypes.INTEGER, allowNull: false },
    topic:      { type: DataTypes.STRING(64), allowNull: false },
    language:   { type: DataTypes.STRING(32), allowNull: false },
    statement:  { type: DataTypes.TEXT('long'), allowNull: false },
    input_spec: { type: DataTypes.TEXT, allowNull: false },
    output_spec:{ type: DataTypes.TEXT, allowNull: false },
    constraints:{ type: DataTypes.TEXT },
    examples:   { type: DataTypes.JSON, allowNull: false },
    code:       { type: DataTypes.TEXT('long'), allowNull: false },
    blanks:     { type: DataTypes.JSON, allowNull: false }
  }, {
    tableName: 'problem_bank',
    underscored: true,
    timestamps: true
  });
  return ProblemBank;
};
