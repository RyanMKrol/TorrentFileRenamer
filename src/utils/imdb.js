import curl from 'curl';
import cheerio from 'cheerio';

/* eslint-disable */

/**
 * Utility to get an IMDb link which points to the episode list for
 * a given season of a show
 *
 * @param {number} seriesIndex The series number to get a link for
 * @param {string} seriesId The ID of the series to get a link for
 *
 * @returns {string} The URL to find episode information for
 */
function getSeriesLink(seriesIndex, seriesId) {
  return `https://www.imdb.com/title/${seriesId}/episodes?season=${seriesIndex}`;
}

function getNumSeries(seriesLink) {
  return new Promise((resolve, reject) => {
    curl.get(seriesLink, (err, response, body) => {
      try {
        const $ = cheerio.load(body);
        const seasonNumbers = $('#bySeason option')
          .map((_, element) => $(element).text())
          .get().length;

        resolve(seasonNumbers);
      } catch (error) {
        reject(
          new Error(
            `Could not grab number of pages needed from page: ${seriesLink}, error: ${error}`,
          ),
        );
      }
    });
  });
}

/**
 * Method to get episode names from an IMDb page
 *
 * @param {string} seriesLink The link to find episode names from
 * @returns {Array<string>} An array of episode names
 */
async function getEpisodeNames(seriesLink) {
  return new Promise((resolve, reject) => {
    curl.get(seriesLink, (err, response, body) => {
      try {
        const $ = cheerio.load(body);
        const episodeNames = $('.eplist .info strong')
          .map((_, element) => $(element).text())
          .get();

        resolve(episodeNames);
      } catch (error) {
        reject(
          new Error(
            `Could not grab number of pages needed from page: ${seriesLink}, error: ${error}`,
          ),
        );
      }
    });
  });
}

export { getSeriesLink, getNumSeries, getEpisodeNames };
