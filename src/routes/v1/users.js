const express = require('express');
const mysql = require('mysql2/promise');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const { mysqlConfig, jwtSecret } = require('../../config');
const validation = require('../../middleware/validation');
const isLoggedIn = require('../../middleware/auth');

const router = express.Router();

const registrationSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
});

router.post('/register', validation(registrationSchema), async (req, res) => {
  try {
    const hash = bcrypt.hashSync(req.body.password, 10);

    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    INSERT INTO users (name, email, password)
    VALUES (${mysql.escape(req.body.name)}, 
    ${mysql.escape(req.body.email)}, '${hash}')
    `);
    await con.end();

    if (!data.insertId || data.affectedRows !== 1) {
      return res.status(500).send({ err: 'A server issue has occured. Please try again later' });
    }

    return res.send({ msg: 'Succesfully created account', accountId: data.insertId });
  } catch (err) {
    return res.status(500).send({ err: 'A server issue has occured. Please try again later' });
  }
});

router.post('/login', validation(userLoginSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    SELECT id, email, password 
    FROM users 
    WHERE email = ${mysql.escape(req.body.email)} 
    LIMIT 1`);
    await con.end();

    if (data.length === 0) {
      return res.status(400).send({ err: 'User Not Found' });
    }

    if (!bcrypt.compareSync(req.body.password, data[0].password)) {
      return res.status(400).send({ err: 'Incorrect username or password' });
    }

    const token = jsonwebtoken.sign({ accountId: data[0].id }, jwtSecret);

    return res.send({ msg: 'Succesfully logged in', token });
  } catch (err) {
    return res.status(500).send({ err: 'A server issue has occured. Please try again later' });
  }
});

router.post('/change-password', isLoggedIn, validation(changePasswordSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    SELECT id, email, password 
    FROM users 
    WHERE id = ${mysql.escape(req.user.accountId)}
    LIMIT 1
    `);

    const checkHash = bcrypt.compareSync(req.body.oldPassword, data[0].password);

    if (!checkHash) {
      await con.end();
      return res.status(400).send({ err: 'Incorrect Old Password' });
    }

    const newPasswordHash = bcrypt.hashSync(req.body.newPassword, 10);

    const changePassDBRes = await con.execute(
      `UPDATE users SET password = ${mysql.escape(newPasswordHash)} WHERE id = ${mysql.escape(req.user.accountId)}`,
    );

    await con.end();
    if (!changePassDBRes) {
      return res.send({ msg: 'Something went wrong, please try again' });
    }
    return res.send({ msg: 'Password has been changed' });
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
