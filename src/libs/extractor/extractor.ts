import axios from 'axios';
import { load } from 'cheerio';
import {
  arrayNotEmpty,
  isEmpty,
  isNotEmpty,
  isNotEmptyObject,
} from 'class-validator';
import { parseHtml } from 'libxmljs2';
import { BASEURL_DECODER_ACTION_OTAKUDESU } from './constant';
import { OtakudesuHelper } from './otakudesu';
import {
  ExtractUrlProps,
  OtakudesuVideoDetail,
  OtakudesuVideoPayload,
} from './types';

export class ExtractorUrl {
  constructor() {}

  /**
   * Extracts the URL for downloading a file from Google Drive.
   *
   * @param {ExtractUrlProps} url - The URL of the source file.
   * @return {Promise<string | null>} - The URL for downloading the file, or null if the URL is empty or the file does not exist.
   * @throws {Error} - If the URL is empty.
   * @throws {Error} - If the file does not exist.
   */
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
      } else {
        return null;
      }

      return urlDownload?.searchParams?.size > 1
        ? urlDownload?.toString()
        : null;
    } catch (error: any) {
      if ([400, 404].includes(error?.response?.status)) return null;

      throw error;
    }
  }

  /**
   * Extracts the video URL from a given URL using the Otakudesu video platform.
   *
   * @param {ExtractUrlProps} url - The URL of the video.
   * @param {string} resolution - The desired resolution of the video. Defaults to '480p'.
   * @return {Promise<string | null>} - The extracted video URL, or null if the URL is empty or the video does not exist.
   * @throws {Error} - If the URL is empty.
   * @throws {Error} - If the video does not exist.
   * @throws {Error} - If there is a bad response from the server.
   */
  async extractVideoUrlOtakudesu({
    url,
    resolution = '480p',
  }: ExtractUrlProps): Promise<string | null> {
    if (isEmpty(url)) throw new Error('url cannot be empty!');

    const responseUrl = await axios.get(url);
    if (responseUrl?.status !== 200) throw new Error('Bad Response');

    let formData: OtakudesuVideoPayload = {
      id: 0,
      i: 0,
      q: '',
      nonce: '',
      action: '',
    };
    const $ = parseHtml(responseUrl?.data);
    const encodedVideoDetail: OtakudesuVideoDetail =
      OtakudesuHelper.getOtakudesuVideoHashMirror($);
    const otakudesuTokens = OtakudesuHelper.getOtakudesuToken($);

    if (arrayNotEmpty(otakudesuTokens)) {
      const { data, status } = await axios.post<{ data: string }>(
        BASEURL_DECODER_ACTION_OTAKUDESU,
        { action: otakudesuTokens[1] },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      if (status !== 200) throw new Error('Bad Response while get token');

      formData = {
        ...formData,
        ...encodedVideoDetail,
        q: resolution,
        action: otakudesuTokens[0],
        nonce: data?.data,
      };
    }

    if (isNotEmptyObject(encodedVideoDetail)) {
      const { data, status } = await axios.post<{ data: string }>(
        BASEURL_DECODER_ACTION_OTAKUDESU,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      if (status !== 200)
        throw new Error('Bad Response while get encoded video component');

      return data?.data;
    }

    return null;
  }
}
