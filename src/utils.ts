import {exec} from './exec';

export const getRootPath: () => Promise<string> = async (): Promise<string> => {
  const {stdout, stderr} = await exec('git rev-parse --show-toplevel');
  return stderr ? stderr.trim() : stdout.trim();
};
