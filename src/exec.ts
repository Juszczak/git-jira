import {exec as execAsync} from 'child_process';
import {promisify} from 'util';

export const exec = promisify(execAsync);
