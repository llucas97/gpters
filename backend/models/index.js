const dbConfig = require("../config/db.config.js");
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ✅ 먼저 모델 정의
db.User = require("./user.model.js")(sequelize, DataTypes);
db.Survey = require("./survey")(sequelize, DataTypes);
db.Problem = require('./problem')(sequelize, DataTypes);

// ✅ 기존 스키마 기반 모델들
db.Submission = require('./submission')(sequelize, DataTypes);
db.Statistics = require('./statistics')(sequelize, DataTypes);


// ✅ 모델 관계 설정
if (db.User.associate) db.User.associate(db);
if (db.Survey.associate) db.Survey.associate(db);
if (db.Problem.associate) db.Problem.associate(db);

// ✅ 기존 스키마 모델들의 관계 설정
if (db.Submission.associate) db.Submission.associate(db);
if (db.Statistics.associate) db.Statistics.associate(db);

module.exports = db;
