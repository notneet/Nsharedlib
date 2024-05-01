import { isNotEmpty } from 'class-validator';
import { Document } from 'libxmljs2';
import { OtakudesuVideoDetail } from './types';

export class OtakudesuHelper {
  constructor() {}

  static getOtakudesuVideoHashMirror($: Document): OtakudesuVideoDetail {
    const encodedVideoDetail: any = $.get(
      `(//div[@class='mirrorstream']/ul//a)[1]/@data-content`,
    );

    if (isNotEmpty(encodedVideoDetail)) {
      const decodedVideoDetail: OtakudesuVideoDetail = JSON.parse(
        atob(encodedVideoDetail?.value()),
      );

      return decodedVideoDetail;
    }

    return {} as OtakudesuVideoDetail;
  }

  static getOtakudesuToken($: Document): string[] {
    const scriptXpath = $.get('(//script[3])[4]');
    const actionTokenMatch = scriptXpath
      ?.toString()
      ?.match(/action:"([^"]+)"/g);
    const actionTokenMatchReplaced = Array.from(
      new Set(actionTokenMatch || []),
    )?.map((it) => it?.replace(/action:/g, '')?.replace(/"/g, ''));

    return actionTokenMatchReplaced;
  }
}
