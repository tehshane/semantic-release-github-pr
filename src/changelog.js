const { create } = require('./comment-tag');

const HEADER = {
  RELEASE: 'Merging this PR will publish the following release:\n\n',
  NO_RELEASE: 'Merging this PR will **not** publish a release.',
};

const addChangelog = (
  { githubRepo, npmPackage: { name: npmPackageName } },
  { logger, nextRelease: { gitHead, gitTag = null, notes } }
) => async ({ number, title }) => {
  const body =
    create(gitHead, npmPackageName, gitTag) +
    '\n' +
    (notes ? HEADER.RELEASE + notes : HEADER.NO_RELEASE);

  logger.log(`Creating changelog comment on PR "${title}"`);

  // To create a general PR comment (unassociated with a line number),
  // we must create it on the corresponding issue that GitHub creates.
  // https://stackoverflow.com/questions/16744069/create-comment-on-pull-request
  await githubRepo.createIssueComment({
    number,
    body,
  });
};

const removeChangelog = () => {
  const deleteChangelog = (
    { githubRepo, npmPackage: { name: npmPackageName } },
    { logger, nextRelease: { gitHead } }
  ) => async ({ number, title }) => {
    comments.forEach(async ({ id, body }) => {
      logger.log(`Deleting stale changelog comment on PR "${title}"`);
      await githubRepo.deleteIssueComment({ id });
    });
  };
};

modul.exports = {
  addChangelog,
  removeChangelog,
};
