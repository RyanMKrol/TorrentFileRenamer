import { ls, find } from 'shelljs';

/**
 * Gets the path string before the file
 *
 * @param {string} path Path to resource
 * @returns {string} Root path
 */
function getRootPathItem(path) {
  return path.match(/(.*)\/(.*)/)[1];
}

/**
 * Gets the resource located at the end of a path
 *
 * @param {string} path Path to resource
 * @returns {string} Resource name
 */
function getLastPathItem(path) {
  console.log(path);
  return path.match(/.*\/(.*)/)[1];
}

/**
 * Gets the file extension of a file given by a path
 *
 * @param {string} path Path to resource
 * @returns {string} Extension of resource
 */
function getPathExtension(path) {
  return path.match(/.*\.(.*)/)[1];
}

/**
 * Returns all paths to directories under a given path
 *
 * @param {string} path Path to search
 * @returns {Array<string>} Array of directories under given path
 */
function findDirectoriesAtPath(path) {
  return ls('-d', `${path}/*/`).map((item) => getRootPathItem(item));
}

/**
 * Returns all paths to supported videos under provided path
 *
 * @param {string} path Path to search
 * @returns {Array<string>} Array of paths to video resources under given path
 */
function findVideoPaths(path) {
  return findWithFilter(path, /.(mp4|mkv|avi|AVI)$/);
}

/**
 * Utility to do finds with filters attached
 *
 * @param {string} path Path of directory to begin search with
 * @param {RegExp} filter Regex to filter results by
 * @returns {Array<string>} Array of paths
 */
function findWithFilter(path, filter) {
  return find(path).filter((file) => file.match(filter));
}

export {
  getRootPathItem,
  getLastPathItem,
  getPathExtension,
  findDirectoriesAtPath,
  findVideoPaths,
  findWithFilter,
};
