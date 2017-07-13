import {exec} from 'child_process';

export const getRootPath: () => Promise<string> = async (): Promise<string> => {
  return new Promise((resolve: (path: string) => void, reject: (error: Error) => void): void => {
    exec('git rev-parse --show-toplevel', async (error: Error, stdout: string) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
};
