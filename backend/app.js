const db = require("./models");
const bodyParser = require('body-parser');
const express = require('express');
const passport = require('passport');
const path = require('path');
const authRoutes = require('./auth/routes');
const initPassport = require('./auth/passport');
const localAuthRoutes = require('./routes/localAuth');
const passportRoutes = require('./auth/routes');
const app = express();
require('dotenv').config();
initPassport();

app.use(passport.initialize());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views/register.html')));

app.use(bodyParser.json());
app.use('/auth', passportRoutes);      
app.use('/local', localAuthRoutes); 

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

db.sequelize.authenticate()
  .then(() => console.log("RDS 연결 성공"))
  .catch(err => console.error("RDS 연결 실패:", err));