const debug = require('debug')('semantic-release:github-pr');
const { parse } = require('./comment-tag');

/**
 * To keep from spamming each PR with comments, we identify any previous
 * comments posted by this plugin (using `commentTag`) and delete them.
 *
 * Returns a function accepting a Github PR object (as returned by the Github API).
 *
 * @param pluginConfig
 * @param config
 */
const deleteChangelog = (
  { githubRepo, npmPackage: { name: npmPackageName } },
  { logger, nextRelease: { gitHead } }
) => async ({ id, title }) => {
  const { data: comments } = await githubRepo.getIssueComments({ number });

  comments.forEach(async ({ id, body }) => {
    logger.log(`Deleting stale changelog comment on PR "${title}"`);
    await githubRepo.deleteIssueComment({ id });
  });
};

module.exports = deleteChangelog;
