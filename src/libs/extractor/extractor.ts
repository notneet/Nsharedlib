import axios from 'axios';
import { load } from 'cheerio';
import { arrayNotEmpty, isEmpty, isNotEmptyObject } from 'class-validator';
import { parseHtml } from 'libxmljs2';
import { BASEURL_DECODER_ACTION_OTAKUDESU } from './constant';
import { GDriveHelper } from './media/gdrive';
import { OtakudesuHelper } from './media/otakudesu';
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
      const responseUrl = await axios.get(url);
      const $ = load(responseUrl?.data);

      if (url?.includes('drive.usercontent.google.com')) {
        return GDriveHelper.mappingPayloadFromUserContent($);
      }

      if (url?.includes('drive.google.com')) {
        return GDriveHelper.mappingPayloadNormal(url);
      }

      return null;
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
  async extractVideoEmbedOtakudesu({
    url,
    resolution = '480p',
  }: ExtractUrlProps): Promise<string | null> {
    if (isEmpty(url)) throw new Error('url cannot be empty!');

    try {
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
        OtakudesuHelper.getOtakudesuVideoHashMirror($, resolution);
      const otakudesuTokens = OtakudesuHelper.getOtakudesuToken($);

      if (isEmpty(encodedVideoDetail?.i)) return null;

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
    } catch (error: any) {
      if ([400, 404].includes(error?.response?.status)) return null;

      throw error;
    }
  }

  async extractVideoUrlOtakudesu({
    url,
    resolution = '480p',
  }: ExtractUrlProps) {
    const videoEmbed = atob(
      (await this.extractVideoEmbedOtakudesu({ url, resolution })) || '',
    );
    if (isEmpty(videoEmbed)) return null;

    const iframe = load(videoEmbed);
    const iframeSrc = iframe('iframe').attr('src') || '';
    if (isEmpty(iframeSrc)) throw new Error('iframeSrc are empty');

    const responseEmbed = await axios.get(iframeSrc);
    const $ = load(responseEmbed.data);
    const videoSource =
      $('script[type="text/javascript"]').first().html() || '';
    const match = /'file':'([^']+)'/gm.exec(videoSource);
    const videoFileUrl = match && match[1];

    return videoFileUrl;
  }
}
