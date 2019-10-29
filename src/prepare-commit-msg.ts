import {readFile, writeFile} from 'fs';
import {IncomingMessage} from 'http';
import {get, RequestOptions} from 'https';
import {resolve} from 'path';
import {promisify} from 'util';
import {exec as execAsync} from 'child_process';

interface Environment {
  password?: string;
  username?: string;
  url?: string;
}

interface Credentials {
  host: string;
  password: string;
  username: string;
  port?: number;
}

interface JiraResponse {
  issues: JiraIssue[];
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    parent: {
      key: string;
    };
  };
}

const commitEditMsg: string = '.git/COMMIT_EDITMSG';

const exec = promisify(execAsync);

async function getRootPath() {
  const {stdout, stderr} = await exec('git rev-parse --show-toplevel');
  return stderr ? stderr.trim() : stdout.trim();
}

function readCredentialsFromEnv() {
  return {
    username: process.env.GIT_JIRA_USER,
    password: process.env.GIT_JIRA_PASSWORD,
    url: process.env.GIT_JIRA_URL,
  } as Environment;
}

async function getCredentials() {
  const environment = readCredentialsFromEnv();

  if (!(environment.username && environment.password && environment.url)) {
    console.log(`No GIT_JIRA_USER, GIT_JIRA_PASSWORD or ENV_VARS.GIT_JIRA_URL set.`);
    process.exit(1);
  }

  const {password, username}: Environment = environment;
  const url: string[] = (environment.url as string).split(':');
  const host: string = url[0];
  const port: number = url.length > 1 ? parseInt(url[1], 10) : 443;
  return {host, password, username, port} as Credentials;
}

async function getResponseData(response: IncomingMessage) {
  return new Promise<string>(
    (resolveCb: (data: string) => void, rejectCb: (error: Error) => void): void => {
      let data: string = '';
      response.on('data', (chunk: string) => {
        data += chunk;
      });
      response.on('end', () => resolveCb(data));
      response.on('error', (error: Error) => rejectCb(error));
    },
  );
}

async function fetchIssues({host, password, username, port}: Credentials) {
  const request: RequestOptions = {
    auth: `${username}:${password}`,
    headers: {'Content-Type': 'application/json'},
    host,
    port: port ? port : undefined,
    path: `/rest/api/2/search?jql=assignee=${username}`,
  };

  return new Promise<JiraResponse>(async (resolveCb: (response: JiraResponse) => void, rejectCb: (error: string) => void) => {
    get(request, async (response: IncomingMessage) => {
      try {
        resolveCb(JSON.parse(await getResponseData(response)) as JiraResponse);
      } catch (error) {
        rejectCb(error.message);
      }
    }).on('error', error => {
      rejectCb(error.message);
    });
  });
}

async function getGitBranchName() {
  const {stdout, stderr} = await exec('git rev-parse --abbrev-ref HEAD');
  return stderr ? stderr.trim() : stdout.trim();
}

async function prepareCommitMessage(branch: string) {
  try {
    const credentials = await getCredentials();
    let response: JiraResponse;
    try {
      response = await fetchIssues(credentials);
    } catch (error) {
      return `[${branch}]`;
    }
    const header: string = response.issues
      .filter((issue: JiraIssue) => issue.key === branch)
      .reduce((message: string, issue: JiraIssue) => {
        const parent: string = issue.fields.parent && issue.fields.parent.key ? `[${issue.fields.parent.key}]` : '';
        message = parent + `[${issue.key}] ${issue.fields.summary}\n\nChanges made:\n- `;
        return message;
      }, '');
    return header;
  } catch (error) {
    return error.message as string;
  }
}

async function setCommitEditMsg() {
  const branch = await getGitBranchName();
  const rootPath = await getRootPath();
  const commitMessagePath = resolve(rootPath.trim(), commitEditMsg.trim());
  readFile(commitMessagePath, 'utf8', async (error, message: string) => {
    if (error) throw new Error(error.message);

    if (!~message.substr(0, 20).indexOf(`[${branch}]`)) {
      const prependExistingMessage = async (msg: string) => {
        const header = await prepareCommitMessage(branch);
        return `${header}\n${msg}`;
      };
      writeFile(commitMessagePath, await prependExistingMessage(message), () => null);
    }
  });
}

if (!process.env.DISABLE_GIT_JIRA) {
  setCommitEditMsg();
}
