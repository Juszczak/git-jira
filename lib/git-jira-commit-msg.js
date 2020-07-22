#!/usr/bin/env node

const { get } = require('https');
const { execSync } = require('child_process');
const { EOL } = require('os');

function validate_args(...args) {
  return args.every((arg) => typeof arg === 'string' && arg.length);
}

const verbose = !process.env.GIT_JIRA_SILENT;
const username = process.env.GIT_JIRA_USER;
const password = process.env.GIT_JIRA_PASSWORD;
const url = process.env.GIT_JIRA_URL;
const timeout = +process.env.GIT_JIRA_TIMEOUT || 5000;
const eol = process.env.GIT_JIRA_EOL;

function print(io, message) {
  io.write(`${message}${eol ? '' : EOL}`);
}

function exec(command) {
  return execSync(command, { encoding: 'utf8' });
}

function error(code, message) {
  verbose && print(process.stderr, message);
  process.exit(code);
}

if (!validate_args(username, password, url)) {
  error(1, 'Missing GIT_JIRA_USER, GIT_JIRA_PASSWORD or GIT_JIRA_URL environment variable.');
}

const { hostname, port = '443' } = new URL(url.indexOf('https') === 0 ? url : 'https://' + url);

if (!validate_args(hostname, port)) {
  error(2, 'GIT_JIRA_URL has wrong format.');
}

try {
  execSync('git rev-parse --is-inside-work-tree 2>/dev/null', { encoding: 'utf8' });
} catch (error) {
  error(3, 'Not inside the git repository');
}

const branch = process.argv[2] ? process.argv[2] : execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

if (typeof branch !== 'string') {
  error(4, 'Missing git branch specified.');
}

const auth = `${username}:${password}`;
const headers = { 'Content-Type': 'application/json' };
const path = `/rest/api/2/search?jql=assignee=${username}`;

const request = { auth, headers, hostname, port, path, timeout };

get(request, (message) => {
  let data = '';

  message.on('data', (chunk) => {
    data += chunk;
  });

  message.on('error', (err) => {
    error(5, `Cannot fetch data from https://${hostname}:${port}`);
  });

  message.on('timeout', () => {
    error(6, 'Request timeout.');
  });

  message.on('end', () => {
    try {
      const { issues } = JSON.parse(data);
      const message = issues
        .filter((issue) => issue.key === branch)
        .reduce((message, issue) => {
          const parent = issue.fields.parent && issue.fields.parent.key ? `[${issue.fields.parent.key}]` : '';
          message = parent + `[${issue.key}] ${issue.fields.summary}`;
          return message;
        }, '');

      if (message.length) {
        print(process.stdout, message);
        process.exit(0);
      } else {
        error(7, `No Jira issue found for branch ${branch}.`);
      }
    } catch (err) {
      if (message.statusCode === 401) {
        error(9, 'Invalid credentials.');
      } else {
        error(8, `Cannot parse the response.`);
      }
    }
  });
});
