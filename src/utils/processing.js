/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */

import { mv } from 'shelljs';
import inquirer from 'inquirer';
import {
  getRootPathItem,
  getPathExtension,
  findDirectoriesAtPath,
  findVideoPaths,
} from './finders';

import { getSeriesLink, getNumSeries, getEpisodeNames } from './imdb';

/**
 * Finds the number of seasons listed on IMDb for all provided seasons
 *
 * @param {object} input Blob of input data passed through program
 * @returns {object} Modified blob of input data
 */
async function addNumberOfSeasonsToInput(input) {
  return Object.keys(input).reduce(async (acc, item) => {
    const seasonLink = await getSeriesLink(0, input[item].imdbId);
    const numSeasons = await getNumSeries(seasonLink);

    return acc.then((newAcc) => ({
      ...newAcc,
      [item]: {
        ...input[item],
        numSeasons,
      },
    }));
  }, Promise.resolve({}));
}

/**
 * Finds all of the episodes for a given IMDb ID
 *
 * @param {number} numSeasons The number of seasons
 * @param {string} imdbId The IMDb ID of the show
 * @returns {object} Modified blob of input data
 */
function fetchEpisodeNamesForShow(numSeasons, imdbId) {
  return [...Array(numSeasons).keys()].reduce(async (episodeNumsAcc, seasonNum) => {
    const seasonLink = await getSeriesLink(seasonNum + 1, imdbId);
    const episodeNames = await getEpisodeNames(seasonLink);

    return episodeNumsAcc.then((newEpisodeNumsAcc) => ({
      ...newEpisodeNumsAcc,
      [seasonNum + 1]: episodeNames,
    }));
  }, Promise.resolve({}));
}

/**
 * Finds all of the episodes for all of the input shows
 *
 * @param {object} input Blob of input data passed through program
 * @returns {object} Modified blob of input data
 */
async function addEpisodeNamesToInput(input) {
  return Object.keys(input).reduce(async (acc, key) => {
    const episodeNames = await fetchEpisodeNamesForShow(input[key].numSeasons, input[key].imdbId);

    return acc.then((newAcc) => ({
      ...newAcc,
      [key]: {
        ...input[key],
        episodeNames,
      },
    }));
  }, Promise.resolve({}));
}

/**
 * Pairs all of the episode paths with the name of that episode
 *
 * @param {object} input Blob of input data passed through program
 * @returns {Array<Array<object>>} An array of seasons which are an array of objects
 * each with the path to the episode, and the name of that episode
 */
function getEpisodePathsWithEpisodeNames(input) {
  return Object.values(input).map((blob) => {
    const seasonPaths = findDirectoriesAtPath(blob.tvShowRootPath).sort();
    const seasonEpisodePaths = seasonPaths.map(findVideoPaths).map((array) => array.sort());

    return seasonEpisodePaths.map((epsForSeason, seasonIndex) => epsForSeason.map((episodePath, episodeIndex) => ({
      path: episodePath,
      name: blob.episodeNames[`${seasonIndex + 1}`][episodeIndex],
    })));
  });
}

/**
 * Renames every file found at the input paths, to an episode with a number,
 * and the name of the episode
 *
 * @param {Array<Array<object>>} input An array of seasons which are an array of objects
 * each with the path to the episode, and the name of that episode
 */
async function renameEpisodes(input) {
  for (let i = 0; i < input.length; i += 1) {
    for (let j = 0; j < input[i].length; j += 1) {
      const episodeItem = input[i][j];

      const episodeRoot = getRootPathItem(episodeItem.path);
      const extension = getPathExtension(episodeItem.path);
      const newNamePath = `${episodeRoot}/Episode ${String(j + 1).padStart(2, '0')} - ${
        episodeItem.name
      }.${extension}`;

      if (episodeItem.path === newNamePath) {
        console.log('Old path would the same as the new path, skipping - ', episodeItem.path);
      } else {
        console.log('This is the suggested renaming:');
        console.log(episodeItem.path);
        console.log(newNamePath);

        await inquirer
          .prompt([
            {
              name: 'confirmation',
              type: 'confirm',
              message: 'Sound good?',
            },
          ])
          .then((answer) => {
            if (answer.confirmation) {
              mv(episodeItem.path, newNamePath);
            }
          });
      }
    }
  }
}

/**
 * Renames every season folder to Season X
 *
 * @param {object} input Blob of input data passed through program
 */
async function renameSeasons(input) {
  const seasonPathsArray = Object.values(input).map((path) => findDirectoriesAtPath(path.tvShowRootPath));

  for (let i = 0; i < seasonPathsArray.length; i += 1) {
    for (let j = 0; j < seasonPathsArray[i].length; j += 1) {
      const seasonPath = seasonPathsArray[i][j];
      const root = getRootPathItem(seasonPath);
      const newPath = `${root}/Season ${j + 1}`;

      if (seasonPath === newPath) {
        console.log('Old path would the same as the new path, skipping - ', seasonPath);
      } else {
        console.log('This is the suggested renaming:');
        console.log(seasonPath);
        console.log(newPath);

        await inquirer
          .prompt([
            {
              name: 'confirmation',
              type: 'confirm',
              message: 'Sound good?',
            },
          ])
          .then((answer) => {
            if (answer.confirmation) {
              mv(seasonPath, newPath);
            }
          });
      }
    }
  }
}

export {
  addNumberOfSeasonsToInput,
  addEpisodeNamesToInput,
  getEpisodePathsWithEpisodeNames,
  renameEpisodes,
  renameSeasons,
};
