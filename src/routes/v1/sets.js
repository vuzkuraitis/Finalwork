const express = require('express');
const mysql = require('mysql2/promise');
const Joi = require('joi');

const router = express.Router();

const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mysqlConfig } = require('../../config');

const setSchema = Joi.object({
  weight: Joi.number().required(),
  reps: Joi.number().required(),
  sets: Joi.number().required(),
  exercise_id: Joi.number().required(),
});

router.get('/', isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`SELECT * FROM sets WHERE user_id = ${req.user.accountId}`);
    await con.end();

    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.get('/sets', isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(
      `SELECT * FROM sets LEFT JOIN exercises on sets.user_id = exercises.id WHERE user_id = ${req.user.accountId}`,
    );
    await con.end();

    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/addset', isLoggedIn, validation(setSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`INSERT INTO sets (weight, reps, sets, user_id, exercise_id)
          VALUES (${mysql.escape(req.body.weight)}, 
          ${mysql.escape(req.body.reps)},
          ${mysql.escape(req.body.sets)},
          ${mysql.escape(req.user.accountId)},
          ${mysql.escape(req.body.exercise_id)})
          `);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ err: 'Please try again' });
    }
    return res.send({ msg: 'Succesfully added a set' });
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
