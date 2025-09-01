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
db.LevelTest = require('./levelTest')(sequelize, DataTypes);

// ✅ 모델 관계 설정
if (db.User.associate) db.User.associate(db);
if (db.Survey.associate) db.Survey.associate(db);
if (db.LevelTest.associate) db.LevelTest.associate(db);

module.exports = db;
