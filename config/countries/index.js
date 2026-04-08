'use strict';

/**
 * Reads all country JSON config files from this directory and exports them
 * as an array of { countryCode, positions } objects.
 *
 * Adding a new country is as simple as dropping a new <CC>.json file here.
 */

const fs = require('fs');
const path = require('path');

const countriesDir = __dirname;

const allCountries = fs
  .readdirSync(countriesDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => {
    const filePath = path.join(countriesDir, file);
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      throw new Error(`Failed to parse country config file "${filePath}": ${err.message}`);
    }
  });

/**
 * All positions across all countries, each annotated with its countryCode.
 * @type {Array<{slug: string, title: string, titleEn: string, positionTypeKey: string, scope: string, order: number, icon: string, chamberKey: string|null, countryCode: string}>}
 */
const allPositions = allCountries.flatMap((country) =>
  country.positions.map((pos) => ({ ...pos, countryCode: country.countryCode }))
);

module.exports = { allCountries, allPositions };
