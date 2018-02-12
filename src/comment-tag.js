const { equals } = require('ramda');

const create = (gitHead, packageName, gitTag = null) => {
  // There isn't a built-in concept of a markdown comment.
  // We interpret this format as a markdown comment: [//]: # (message)
  // https://stackoverflow.com/questions/4823468/comments-in-markdown/20885980#20885980
  return `[//]: # (semantic-release-github-pr ${gitHead} ${packageName} ${gitTag})`;
};

const PARSE_REGEXP = /\[\/\/\]: # \(semantic-release-github-pr( [^\)]+)+\)/;

const parse = str => {
  const result = ((str && str.toString()) || '').match(PARSE_REGEXP);
  const matches = (result && result[1].trim().split(' ')) || [];

  if (matches.length === 0) {
    return null;
  }

  return {
    matchesGitHead: equals(matches[0]),
    matchesPackageName: equals(matches[1]),
    matchesGitTag: equals(matches[2]),
  };
};

/**
 * We could just consider all previous comments stale, but to be compatible
 * with `semantic-release-monorepo`, we take care not to remove comments
 * made with the same `gitHead` but a different `npmPackageName`. Comments
 * fitting that criteria would only exist in a monorepo scenario.
 *
 * @param {String} gitHead `git` commit to match the comment against.
 * @param {String} npmPackageName `npm` package name to match the comment against.
 * @returns {Object} A match object with keys representing the results.
 */
const match = (gitHead, npmPackageName) => comment => {
  const { matchesGitHead, matchesPackageName, matchesGitTag } =
    parse(comment) || {};

  debug(`Comment is a PR changelog: %o`, !!result);
  if (!result) {
    return false;
  }

  const isSameCommit = matchesGitHead(gitHead);
  const isSamePackage = matchesPackageName(npmPackageName);
  const isNoRelease = matchesGitTag('null');

  debug(`Comment matches git head: %o`, isSameCommit);
  debug(`Comment matches npm package name: %o`, isSamePackage);
  debug(`Comment is "no release" comment: %o`, isNoRelease);

  return {
    isStale: !isSameCommit && isSamePackage,
    isNoRelease,
  };
};

module.exports = {
  create,
  match,
  parse,
};
