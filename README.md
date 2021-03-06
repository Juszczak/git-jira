# Git Jira

🤖 Automation tool that fetches data from Jira API by the git branch name

# Install
```
curl https://raw.githubusercontent.com/Juszczak/git-jira/master/scripts/install | bash
```

The script installs its exec util into `$HOME/.bin`. Make sure to add this directory to your path:

```
export PATH="$HOME/.bin:$PATH"
```

# Setup

Set up Jira credentials as environment variables:

```bash
  export GIT_JIRA_USER=your_username
  export GIT_JIRA_PASSWORD=your_password
  export GIT_JIRA_URL=your_jira_hostname_with_port
```

# Usage

## Standalone

```
git-jira-commit-msg [branch]
```

## Git

```
git jira-commit-msg [branch]
```

## Vim

:PrepareCommitMessage
