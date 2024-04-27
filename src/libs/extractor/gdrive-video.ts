import * as axios from 'axios';
import { isEmpty } from 'class-validator';
import { GdriveVideoProps } from './types';

export const extractUrlGdrive = async ({
  url,
}: GdriveVideoProps): Promise<string> => {
  if (isEmpty(url)) throw new Error('url cannot be empty!');

  try {
    const responseUrl = await axios.default.get(url);

    return responseUrl.data;
  } catch (error) {
    throw error;
  }
};
