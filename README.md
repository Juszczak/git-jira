# git-jira
🤖 Automation tool that fetches data from Jira API by current git branch and uses prepare-commit-msg hook

# Install
1. Install dependencies by typing `npm install` or `yarn`
2. Set up your project to use git-jira by typing: `./install`
3. Set up Jira credentials as environment variables:
```bash
  export GIT_JIRA_USER=your_username
  export GIT_JIRA_PASSWORD=your_password
  export GIT_JIRA_URL=your_jira_hostname_with_port
```

> `GIT_JIRA_URL` should not include the protocol

# Uninstall
Run `./uninstall path/to/project/root`

# Usage
Run the binary from the repo currently commiting to. It prints the commint message to stout.
Export it to path as `pg`.
In vim run `read !pg` when writing commit message.

> For performance purposes, the script fetches only issues *assigned to the current user*

# Disable
Set `DISABLE_GIT_JIRA` env variable

```
DISABLE_GIT_JIRA=true git commit
```
