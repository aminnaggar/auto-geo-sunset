const debug = require('debug')('auto-geo-sunset');
const SunCalc = require('suncalc');
const IpInfo = require('ipinfo');
const wJSON = require('w-json');
const rJSON = require('r-json');
const abs = require('abs');
const pify = require('pify');

// Oakville, ON, Canada
const DEFAULT_LAT = 43.467517;
const DEFAULT_LNG = -79.687666;
const CONFIG_FILE = '~/.sunset.json';

/**
 * Calculates a sunset Date based on a date, and geo-location
 *
 * @param {Number} lat
 * @param {Number} lng
 * @param {Date} date defaults to today's date
 * @returns {Date}
 */
const calcSunset = (lat, lng, date = new Date()) => {
  const sunsetTime = SunCalc.getTimes(date, lat, lng).sunset;
  return new Date(sunsetTime);
};

/**
 * Fetches your coordinates based on your ip
 * @returns {Promise}
 */
const fetchCoordinates = () =>
  pify(IpInfo)('loc').then(loc => {
    const [lat, lng] = loc.trim().split(',');
    return { lat, lng };
  });

const assertIsCoordinates = (coordinates = {}) => {
  debug('assertIsCoordinates', coordinates);
  const { lat, lng } = coordinates;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    debug('caught a non coordinate');
    throw new Error('Coordinates invalid');
  }
  return coordinates;
};

/**
 * Returns the sunset based on your geo-location.
 *
 * @param {Number} argLat
 * @param {Number} argLng
 * @param {Date} date
 * @param {String} configPath must be the absolute path
 * @returns {Promise} resolves w/ a Date object
 */
const fetchSunset = (
  argLat,
  argLng,
  date = new Date(),
  configPath = CONFIG_FILE,
) =>
  Promise.resolve({ lat: argLat, lng: argLng })
    .then(assertIsCoordinates)
    .catch(() => {
      debug(`attempting to read coordinates from config file: ${configPath}`);
      return pify(rJSON)(abs(configPath)).then(assertIsCoordinates);
    })
    .catch(() => {
      debug('attempting to fetch coordinates by ip');
      return fetchCoordinates()
        .then(({ lat, lng }) => ({
          lat: lat / 1,
          lng: lng / 1,
        }))
        .then(assertIsCoordinates);
    })
    .catch(() => {
      debug(
        'Was not able to fetch from config, or ip. Will default to Oakville, ON, Canada',
      );
      return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    })
    .then(({ lat, lng }) => {
      wJSON(abs(configPath), { lat, lng });
      return calcSunset(lat, lng, date);
    });

module.exports.fetchSunset = fetchSunset;
