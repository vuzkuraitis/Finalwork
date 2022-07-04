const express = require('express');
const mysql = require('mysql2/promise');
const Joi = require('joi');

const { mysqlConfig } = require('../../config');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');

const router = express.Router();

const exerciseSchema = Joi.object({
  name: Joi.string().required(),
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

router.post('/add', isLoggedIn, validation(exerciseSchema), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      INSERT INTO exercises (name)
      VALUES (${mysql.escape(req.body.name)})`);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ err: 'Please try again' });
    }
    return res.send({ msg: 'Successfully added an Exercise' });
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/remove', isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`DELETE FROM exercises 
      WHERE id = ${mysql.escape(req.body.id)}`);
    await con.end();

    if (!data.affectedRows) {
      return res.status(500).send({ err: 'Please try again later' });
    }
    return res.send({ msg: 'Successfully deleted an Exercise' });
  } catch (err) {
    return res.status(500).send({ err: 'A server issue has occured - please try again later' });
  }
});

module.exports = router;
