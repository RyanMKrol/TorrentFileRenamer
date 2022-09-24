#!/usr/bin/env node

import fs from 'fs';

import {
  addNumberOfSeasonsToInput,
  addEpisodeNamesToInput,
  getEpisodePathsWithEpisodeNames,
  renameEpisodes,
  renameSeasons,
} from './utils/processing';

import { getRootPathItem, getLastPathItem, findWithFilter } from './utils/finders';

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

  const tvShowInputData = findWithFilter('.', findIndexFilesRegex).reduce((acc, path) => {
    const rootPath = getRootPathItem(path);
    const showName = getLastPathItem(rootPath);
    const imdbId = JSON.parse(fs.readFileSync(path, 'utf8')).id;

    return {
      ...acc,
      [showName]: {
        tvShowRootPath: rootPath,
        indexPath: path,
        imdbId,
      },
    };
  }, {});

  renameSeasons(tvShowInputData);

  const tvShowInputDataWithSeasonNumbers = await addNumberOfSeasonsToInput(tvShowInputData);

  const tvShowInputDataWithEpisodeNames = await addEpisodeNamesToInput(
    tvShowInputDataWithSeasonNumbers,
  );

  const pathsWithEpisodeNames = getEpisodePathsWithEpisodeNames(tvShowInputDataWithEpisodeNames);

  renameEpisodes(pathsWithEpisodeNames);
}

main();
