#!/usr/bin/env node

import { find, mv } from 'shelljs';
import fs from 'fs';

import { getSeriesLink, getEpisodeNames } from './imdb';

const targetFileName = 'index.json';

/**
 * Main
 */
async function main() {
  // expectation is a file directory like the following
  /*
    TV
      Community
        Season (1)
          Episode (1).mkv
          Episode (2).mkv
          ...
        Season (2)
          ...
        index.json
      Parks and Recreation
        Season (1)
          Episode (1).mp4
          Episode (2).mp4
        Season (2)
          ...
        index.json
  */

  const findIndexFilesRegex = new RegExp(targetFileName, 'g');

  const paths = findWithFilter('.', findIndexFilesRegex);

  const dataWithSeasonPaths = paths.map((path) => ({
    path,
    imdbId: JSON.parse(fs.readFileSync(path, 'utf8')).id,
    seasonPaths: findSeasonPaths(path).sort(),
  }));

  const dataWithEpisodePaths = dataWithSeasonPaths.map((item) => {
    const seasonEpisodePaths = item.seasonPaths.map((path) => findWithFilter(path, /.*Episode.*/));
    return {
      ...item,
      seasonEpisodePaths,
    };
  });

  const dataWithEpisodeNames = await Promise.all(
    dataWithEpisodePaths.map(async (item) => {
      const seasonEpisodeNames = await Promise.all(
        item.seasonPaths
          .map((_, index) => getSeriesLink(index + 1, item.imdbId))
          .map(async (link) => getEpisodeNames(link)),
      );

      return {
        ...item,
        seasonEpisodeNames,
      };
    }),
  );

  dataWithEpisodeNames.forEach((item) => {
    item.seasonEpisodePaths.forEach((episodePaths, seasonIndex) => {
      episodePaths.forEach((episodePath, episodeIndex) => {
        const pathRoot = episodePath.match(/.*\//)[0];
        const newEpisodeName = item.seasonEpisodeNames[seasonIndex][episodeIndex];
        const newEpisodePath = `${pathRoot}Episode ${episodeIndex + 1} - ${newEpisodeName}`;
        mv(episodePath, newEpisodePath);
      });
    });
  });
}

/**
 * Utility to get the paths of each season directory for a given show
 *
 * @param {string} indexPath The path to the index file we're processing
 * @returns {Array<string>} Paths to each season directory
 */
function findSeasonPaths(indexPath) {
  const indexDirectory = indexPath.split(targetFileName)[0];

  // matches paths ending in Season x, or Season (x)
  const seasonPaths = findWithFilter(indexDirectory, /Season (\d+|\(\d+\))$/);

  return seasonPaths;
}

/**
 * Utility to do finds with filters attached
 *
 * @param {string} path Path of directory to begin search with
 * @param {Regex} filter Regex to filter results by
 * @returns {Array<string>} Array of paths
 */
function findWithFilter(path, filter) {
  return find(path).filter((file) => file.match(filter));
}

main();
