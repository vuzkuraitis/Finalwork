const express = require('express');
const mysql = require('mysql2/promise');

const { mysqlConfig } = require('../../config');
const isLoggedIn = require('../../middleware/auth');

const router = express.Router();

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

module.exports = router;
