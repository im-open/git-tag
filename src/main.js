const core = require('@actions/core');
const github = require('@actions/github');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const incrementMajor = core.getInput('increment-major') == 'true';
const incrementMinor = core.getInput('increment-minor') == 'true';
const incrementPatch = core.getInput('increment-patch') == 'true';
const pushTagToRepo = core.getInput('push-new-tag-to-repo') == 'true';
const separator = core.getInput('separator') || '-';
const prefixInput = core.getInput('prefix') || '';
const includePrefixInOutput = core.getInput('include-prefix-in-output') == 'true';

const ghToken = core.getInput('github-token');
const octokit = github.getOctokit(ghToken);

async function run() {
  core.warning('This action has been deprecated.  Use https://github.com/im-open/git-version-lite instead.');

  let newTagToReturn; //This is what is set in the env var/output.  It may or may not include the prefix
  let newTagToPush; //This is the new tag and it will include the prefix.

  try {
    ({ stdout: originalTag } = await exec(`git describe --tags --abbrev=0`));

    originalTag = originalTag.replace('\n', '').trim();
    let originalTagNoPrefix = originalTag.replace(prefixInput, '');

    core.info(`The latest tag is: ${originalTag}`);

    if (!incrementMajor && !incrementMinor && !incrementPatch) {
      core.setOutput('Tag', includePrefixInOutput ? originalTag : originalTagNoPrefix);
      core.exportVariable('TAG', includePrefixInOutput ? originalTag : originalTagNoPrefix);
      return;
    }

    const prefix = includePrefixInOutput ? prefixInput : '';
    const majorMinorPatch = originalTagNoPrefix.split(separator);

    // The regex here will strip out any non-digit character in case the prefix wasn't added correctly
    let major = majorMinorPatch[0] ? parseInt(majorMinorPatch[0].replace(/\D*/i, '')) : 1;
    let minor = majorMinorPatch[1] ? parseInt(majorMinorPatch[1].replace(/\D*/i, '')) : 0;
    let patch = majorMinorPatch[2] ? parseInt(majorMinorPatch[2].replace(/\D*/i, '')) : 0;

    if (incrementMajor) {
      newTagToReturn = `${major + 1}${separator}0${separator}0`;
    } else if (incrementMinor) {
      newTagToReturn = `${major}${separator}${minor + 1}${separator}0`;
    } else if (incrementPatch) {
      newTagToReturn = `${major}${separator}${minor}${separator}${patch + 1}`;
    }
    newTagToPush = `${prefix}${newTagToReturn}`;
    core.info(`The new tag is: ${newTagToReturn}`);
  } catch (error) {
    newTagToReturn = includePrefixInOutput ? 'v1.0.0' : '1.0.0';
    newTagToPush = 'v1.0.0';
    core.info(
      `An error occurred getting the tags for the repo.  It may not have any tags, defaulting to ${newTagToReturn}.`
    );
    core.info(error);
  }
  core.setOutput('Tag', newTagToReturn);
  core.exportVariable('TAG', newTagToReturn);

  if (pushTagToRepo) {
    core.info(`Pushing tag '${newTagToPush}' to the repository...`);
    const git_sha =
      github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha : github.context.sha;
    await octokit.rest.git.createRef({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: `refs/tags/${newTagToPush}`,
      sha: git_sha
    });
  }
}
run();
