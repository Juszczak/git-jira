# git-jira
[![CircleCI](https://circleci.com/gh/Juszczak/git-jira.svg?style=svg)](https://circleci.com/gh/Juszczak/git-jira)
🤖 Automation tool that fetches data from Jira API by current git branch and uses prepare-commit-msg hook

# Install from source
1. Install dependencies by typing `npm install`
2. Set up your project to use git-jira by typing: `npm start path/to/project/root`
3. Set up Jira credentials as environment variables:
```bash
  export GIT_JIRA_USER=your_username
  export GIT_JIRA_PASSWORD=your_password
  export GIT_JIRA_URL=your_jira_hostname_with_port
```

> `GIT_JIRA_URL` should not include the protocol

## Uninstall
Run `npm uninstall path/to/project/root`

# Usage
The tool uses [prepare-commit-msg](https://git-scm.com/docs/githooks#_prepare_commit_msg) hook,
so all you need to do is just `git commit` as usual.

> For performance purposes, the script fetches only issues *assigned to the current user*

# Disable
Set `DISABLE_GIT_JIRA` env variable to temporary disable the tool

```bash
DISABLE_GIT_JIRA=true git commit
```
