import axios from 'axios';
import { load } from 'cheerio';
import { isEmpty, isNotEmpty } from 'class-validator';
import { ExtractUrlProps } from './types';

export class ExtractorUrl {
  constructor() {}

  async extractUrlGdrive({ url }: ExtractUrlProps): Promise<string | null> {
    if (isEmpty(url)) throw new Error('url cannot be empty!');

    try {
      const urlDownload = new URL(
        'https://drive.usercontent.google.com/download',
      );
      const responseUrl = await axios.get(url);

      const $ = load(responseUrl?.data);

      if ($(`input[name='uuid']`).val()) {
        /** Page drive.usercontent.google.com */
        // Get value of each item. and append into download url
        const idValue = String($(`input[name='id']`).val());
        const uuidValue = String($(`input[name='uuid']`).val());
        const exportValue = String($(`input[name='export']`).val());
        const confirmValue = String($(`input[name='confirm']`).val());

        if (isNotEmpty(idValue)) {
          urlDownload.searchParams.append('id', idValue);
        }
        if (isNotEmpty(uuidValue)) {
          urlDownload.searchParams.append('uuid', uuidValue);
        }
        if (isNotEmpty(exportValue)) {
          urlDownload.searchParams.append('export', exportValue);
        }
        if (isNotEmpty(confirmValue)) {
          urlDownload.searchParams.append('confirm', confirmValue);
        }
        //
      } else if (url.includes('drive.google.com')) {
        /** Page drive.google.com */
        const urlVideoSplited = url.split('/');
        const idValue = urlVideoSplited[urlVideoSplited.length - 2];

        if (isNotEmpty(idValue)) {
          urlDownload.searchParams.append('id', idValue);
        }
        urlDownload.searchParams.append('export', 'download');
      }

      return urlDownload?.searchParams?.size > 1
        ? urlDownload?.toString()
        : null;
    } catch (error: any) {
      if ([400, 404].includes(error?.response?.status)) return null;

      throw error;
    }
  }

  async extractUrlOtakudesu({ url }: ExtractUrlProps): Promise<string | null> {
    return '';
  }
}
