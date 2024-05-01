import axios from 'axios';
import { load } from 'cheerio';
import { isEmpty, isNotEmpty } from 'class-validator';
import { parseHtml } from 'libxmljs2';
import { BASEURL_DECODER_ACTION_OTAKUDESU } from './constant';
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

    let formData: OtakudesuVideoPayload = {
      id: 0,
      i: 0,
      q: '',
      nonce: '',
      action: '',
    };
    const responseUrl = await axios.get(url);
    if (responseUrl?.status !== 200) throw new Error('Bad Response');

    const $ = parseHtml(responseUrl?.data);
    const script = $.get('(//script[3])[4]');
    const encodedVideoDetail: any = $.get(
      `(//div[@class='mirrorstream']/ul//a)[1]/@data-content`,
    );

    if (isNotEmpty(encodedVideoDetail)) {
      const decodedVideoDetail: OtakudesuVideoDetail = JSON.parse(
        atob(encodedVideoDetail?.value()),
      );
      formData = {
        ...formData,
        ...decodedVideoDetail,
        q: resolution,
      };
    }

    if (isNotEmpty(script)) {
      const actionTokenMatch = script?.toString()?.match(/action:"([^"]+)"/g);
      const actionTokenMatchReplaced = Array.from(
        new Set(actionTokenMatch),
      )?.map((it) => it?.replace(/action:/g, '')?.replace(/"/g, ''));
      const { data } = await axios.post<{ data: string }>(
        BASEURL_DECODER_ACTION_OTAKUDESU,
        { action: actionTokenMatchReplaced[1] },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      formData.nonce = data?.data;
      formData.action = actionTokenMatchReplaced[0];
    }

    if (isNotEmpty(formData?.id)) {
      const { data, status } = await axios.post<{ data: string }>(
        BASEURL_DECODER_ACTION_OTAKUDESU,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      if (status !== 200) throw new Error('Bad Response');

      return data?.data;
    }

    return null;
  }
}
