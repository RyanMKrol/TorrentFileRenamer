#!/usr/bin/env node
/* eslint-disable */
import { find, mv, ls } from 'shelljs';
import fs from 'fs';

import { getSeriesLink, getEpisodeNames } from './utils/imdb';

const TARGET_FILE_NAME = 'index.json';

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

  const findIndexFilesRegex = new RegExp(TARGET_FILE_NAME, 'g');

  const tvShowPaths = findWithFilter('.', findIndexFilesRegex).reduce((acc, path) => {
    const rootPath = getRootPathItem(path);
    const showName = getLastPathItem(rootPath);

    return {
      ...acc,
      [showName]: {
        path: rootPath,
      },
    };
  }, {});

  const renameSeasons = () => {
    Object.values(tvShowPaths).forEach((item) => {
      const seasonPaths = findSeasonPaths(item.path);
      seasonPaths.forEach((seasonPath, i) => {
        const root = getRootPathItem(seasonPath);
        const newPath = `${root}/Season ${i + 1}`;

        mv(seasonPath, newPath);
      });
    });
  };

  renameSeasons();
  //
  // console.log(tvShowPaths);
  // console.log(seasonPaths);

  // const dataWithSeasonPaths = paths.map((path) => ({
  //   path,
  //   imdbId: JSON.parse(fs.readFileSync(path, 'utf8')).id,
  //   seasonPaths: findSeasonPaths(path).sort(),
  // }));
  //
  // const dataWithEpisodePaths = dataWithSeasonPaths.map((item) => {
  //   const seasonEpisodePaths = item.seasonPaths.map((path) => findWithFilter(path, /.*Episode.*/));
  //   return {
  //     ...item,
  //     seasonEpisodePaths,
  //   };
  // });
  //
  // const dataWithEpisodeNames = await Promise.all(
  //   dataWithEpisodePaths.map(async (item) => {
  //     const seasonEpisodeNames = await Promise.all(
  //       item.seasonPaths
  //         .map((_, index) => getSeriesLink(index + 1, item.imdbId))
  //         .map(async (link) => getEpisodeNames(link)),
  //     );
  //
  //     return {
  //       ...item,
  //       seasonEpisodeNames,
  //     };
  //   }),
  // );
  //
  // dataWithEpisodeNames.forEach((item) => {
  //   item.seasonEpisodePaths.forEach((episodePaths, seasonIndex) => {
  //     episodePaths.forEach((episodePath, episodeIndex) => {
  //       const pathRoot = episodePath.match(/.*\//)[0];
  //       const fileExtension = episodePath.match(/.*\.(.*)/)[1];
  //       const newEpisodeName = item.seasonEpisodeNames[seasonIndex][episodeIndex];
  //       const path = `${pathRoot}Episode ${episodeIndex + 1} - ${newEpisodeName}.${fileExtension}`;
  //
  //       mv(episodePath, path);
  //     });
  //   });
  // });
}

function getRootPathItem(path) {
  return path.match(/(.*)\/(.*)/)[1];
}

function getLastPathItem(path) {
  return path.match(/.*\/(.*)/)[1];
}

/**
 * Utility to get the paths of each season directory for a given show
 *
 * @param {string} indexPath The path to the index file we're processing
 * @returns {Array<string>} Paths to each season directory
 */
function findSeasonPaths(path) {
  // grab only the directories from the index path, then remove the ending /
  return ls('-d', `${path}/*/`).map((item) => getRootPathItem(item));
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
