#!/usr/bin/env node

import {writeFile} from 'fs';
import {resolve} from 'path';
import {createInterface, ReadLine} from 'readline';
import {gitJiraHooksConfigPath} from './constants';
import {ENV_VARS} from './env-vars';
import {Environment} from './interfaces';
import {getRootPath} from './utils';

const promptForCredential: (field: string, variable: string) => Promise<string> = async (field: string, variable: string): Promise<string> => {
  const readline: ReadLine = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  return new Promise<string>((resolve: (value: string) => void): void => {
    readline.question(`No ${variable} set. Type your Jira ${field}: `, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
};

const readUsernameFromEnv: () => Promise<string> = async (): Promise<string> => {
  return process.env[ENV_VARS.GIT_JIRA_USER] as string;
};

const readPasswordFromEnv: () => Promise<string> = async (): Promise<string> => {
  return process.env[ENV_VARS.GIT_JIRA_PASSWORD] as string;
};

const readUrlFromEnv: () => Promise<string> = async (): Promise<string> => {
  return process.env[ENV_VARS.GIT_JIRA_URL] as string;
};

const writeConfig: (config: string) => Promise<void> = async (config: string): Promise<void> => {
  const rootPath: string = await getRootPath();
  const configPath: string = resolve(rootPath, gitJiraHooksConfigPath);
  writeFile(configPath, config);
};

const setup: () => Promise<void> = async (): Promise<void> => {
  const environment: Environment = {};
  if (!readUsernameFromEnv()) environment.username = await promptForCredential('username', ENV_VARS.GIT_JIRA_USER);
  if (!readPasswordFromEnv()) environment.password = await promptForCredential('password', ENV_VARS.GIT_JIRA_PASSWORD);
  if (!readUrlFromEnv()) environment.url = await promptForCredential('url', ENV_VARS.GIT_JIRA_URL);

  if (Object.keys(environment).length) {
    writeConfig(JSON.stringify(environment));
  }
};

setup();
