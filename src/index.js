const { compose } = require('ramda');
const { wrapPlugin } = require('semantic-release-plugin-decorators');
const pluginDefinitions = require('semantic-release/lib/plugins/definitions');

const { match } = require('./comment-tag');
const { addChangelog, removeChangelog } = require('./changelog');
const withGithub = require('./with-github');
const withGitHead = require('./with-git-head');
const withNpmPackage = require('./with-npm-package');
const withMatchingPullRequests = require('./with-matching-pull-requests');

const NAMESPACE = 'githubPr';

const decoratePlugins = compose(
  withGithub,
  withGitHead,
  withMatchingPullRequests,
  withNpmPackage
);

// Use `analyzeCommits` plugin as a hook to post a "no release" PR comment if
// there isn't a new release. We can't do this in `generateNotes` since it only runs
// if there's a new release.
const analyzeCommits = wrapPlugin(
  NAMESPACE,
  'analyzeCommits',
  plugin => async (pluginConfig, config) => {
    const {
      dryRun,
      githubRepo,
      npmPackage: { name: npmPackageName },
      pullRequests,
    } = pluginConfig;
    const { logger, nextRelease: { gitHead, gitTag = null, notes } } = config;
    const nextRelease = await plugin(pluginConfig, config);

    await pullRequests.forEach(async pr => {
      const { data: comments } = await githubRepo.getIssueComments({
        number,
      });

      if (!nextRelease) {
        const { number } = pr;
        const addChangelogToPr = addChangelog(pluginConfig, config);

        // Create "no release" comment if there are no other comments posted
        // by this set of plugins. We want to avoid duplicating the "no release"
        // comment and/or posting it when another package has a release (monorepo).
        if (!comments.some(comment => match(comment).isNoRelease)) {
          createChangelogOnPr(pr);
        }
      }

      comments
        .filter(comment => {
          const { isStale, isNoRelease } = match(comment);
          return isStale && !isNoRelease;
        })
        .forEach(async ({ id }) => {
          logger.log(`Deleting stale changelog comment on PR "${title}"`);
          await githubRepo.deleteIssueComment({ id });
        });
    });

    return nextRelease;
  },
  pluginDefinitions.analyzeCommits.default
);

const generateNotes = wrapPlugin(
  NAMESPACE,
  'generateNotes',
  plugin => async (pluginConfig, config) => {
    const { pullRequests } = pluginConfig;
    const nextRelease = {
      ...config.nextRelease,
      notes: await plugin(pluginConfig, config),
    };
    const addChangelogToPr = addChangelog(pluginConfig, {
      ...config,
      nextRelease,
    });

    // Create "release" comment
    await pullRequests.forEach(addChangelogToPr);

    return nextRelease.notes;
  },
  pluginDefinitions.generateNotes.default
);

module.exports = {
  analyzeCommits: decoratePlugins(analyzeCommits),
  generateNotes: decoratePlugins(generateNotes),
};
