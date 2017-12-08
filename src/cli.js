#!/usr/bin/env node

/* eslint-disable no-console */

const sunset = require('./index');

sunset
  .fetchSunset()
  .then(date => console.log(date))
  .catch(err => console.error(err));
