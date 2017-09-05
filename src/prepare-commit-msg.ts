import {exec} from 'child_process';
import {readFile, writeFile} from 'fs';
import {get, IncomingMessage, RequestOptions} from 'https';
import {resolve} from 'path';
import {commitEditMsg} from './constants';
import {ENV_VARS} from './env-vars';
import {Credentials, Environment, JiraIssue, JiraResponse} from './interfaces';
import {getRootPath} from './utils';

const readCredentialsFromEnv: () => Environment = (): Environment => ({
  username: process.env[ENV_VARS.GIT_JIRA_USER] as string,
  password: process.env[ENV_VARS.GIT_JIRA_PASSWORD] as string,
  url: (process.env[ENV_VARS.GIT_JIRA_URL] as string),
});

const getCredentials: () => Promise<Credentials> = async (): Promise<Credentials> => {
  const environment: Environment = readCredentialsFromEnv();

  if (!(environment.username && environment.password && environment.url)) {
    console.log(`No ${ENV_VARS.GIT_JIRA_USER}, ${ENV_VARS.GIT_JIRA_PASSWORD} or ${ENV_VARS.GIT_JIRA_URL} set.`);
    process.exit(1);
  }

  const {password, username}: Environment = environment;
  const url: string[] = (environment.url as string).split(':');
  const host: string = url[0];
  const port: number = url.length > 1 ? parseInt(url[1], 10) : 443;
  return {host, password, username, port} as Credentials;
};

const fetchIssues: (credentials: Credentials) => Promise<JiraResponse> = async ({host, password, username, port}: Credentials): Promise<JiraResponse> => {
  const request: RequestOptions = {
    auth: `${username}:${password}`,
    headers: {'Content-Type': 'application/json'},
    host,
    port: port ? port : undefined,
    path: `/rest/api/2/search?jql=assignee=${username}+and+resolution=unresolved`,
  };

  const getResponseData: (response: IncomingMessage) => Promise<string> = async (response: IncomingMessage): Promise<string> => {
    return new Promise<string>((resolve: (data: string) => void, reject: (error: Error) => void): void => {
      let data: string = '';
      response.on('data', (chunk: string) => { data += chunk; });
      response.on('end', () => resolve(data));
      response.on('error', (error: Error) => reject(error));
    });
  };

  return new Promise<JiraResponse>(async (resolve: (response: JiraResponse) => void, reject: (error: Error) => void): Promise<void> => {
    get(request, async (response: IncomingMessage): Promise<void> => {
      try {
        resolve(JSON.parse(await getResponseData(response)) as JiraResponse);
      } catch (error) {
        reject(error.message);
      }
    });
  });
};

const getGitBranchName: () => Promise<string> = async (): Promise<string> => {
  return new Promise<string>((resolve: (name: string) => void, reject: (error: Error) => void): void => {
    exec('git rev-parse --abbrev-ref HEAD', async (error: Error, stdout: string) => {
      if (error && /fatal/.test(stdout)) reject(error || stdout.trim());
      else resolve(stdout.trim());
    });
  });
};

const prepareCommitMessage: () => Promise<string> = async (): Promise<string> => {
  try {
    const branch: string = await getGitBranchName();
    const credentials: Credentials = await getCredentials();
    let response: JiraResponse;
    try {
      response = await fetchIssues(credentials);
    } catch (error) {
      return `[${branch}]`;
    }
    const header: string = response.issues
      .filter((issue: JiraIssue) => issue.key === branch)
      .reduce((message: string, issue: JiraIssue) => {
        const parent: string = (issue.fields.parent && issue.fields.parent.key) ? `[${issue.fields.parent.key}]` : '';
        message = parent + `[${issue.key}] ${issue.fields.summary}\n\nChanges made:\n- `;
        return message;
      }, '');
    return header;
  } catch (error) {
    return error.message;
  }
};

const setCommitEditMsg: () => Promise<void> = async (): Promise<void> => {
  const prependExistingMessage: (message: string) => Promise<string> = async (message: string): Promise<string> => {
    const header: string = await prepareCommitMessage();
    return `${header}\n${message}`;
  };
  const rootPath: string = await getRootPath();
  const commitMessagePath: string = resolve(rootPath, commitEditMsg);
  readFile(commitMessagePath, 'utf8', async (error: Error, message: string) => {
    if (error) throw new Error(error.message);
    const final: string = await prependExistingMessage(message);
    if (~message.substr(0, 10).indexOf(final.substr(0, 10))) {
    } else {
      writeFile(commitMessagePath, await prependExistingMessage(message));
    }
  });
};

setCommitEditMsg();
