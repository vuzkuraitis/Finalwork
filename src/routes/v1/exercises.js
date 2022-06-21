const express = require('express');
const mysql = require('mysql2/promise');
const Joi = require('joi');

const { mysqlConfig } = require('../../config');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');

const router = express.Router();

const exerciseSchema = Joi.object({
  name: Joi.string().lowercase().required(),
  description: Joi.string().lowercase().required(),
});

router.get('/', isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute('SELECT * FROM exercises');
    await con.end();

    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/', isLoggedIn, validation(exerciseSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      INSERT INTO exercises (name, description)
      VALUES (${mysql.escape(req.body.name)}, ${mysql.escape(req.body.description)})`);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ err: 'Please try again' });
    }
    return res.send({ msg: 'Successfully added an Exercise' });
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
