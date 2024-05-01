import { isNotEmpty } from 'class-validator';
import { Document } from 'libxmljs2';
import { OtakudesuVideoDetail } from '../types';

export class OtakudesuHelper {
  constructor() {}

  static getOtakudesuVideoHashMirror(
    $: Document,
    resolution: string,
  ): OtakudesuVideoDetail {
    const encodedVideoDetail: any = $.get(
      `(//div[@class='mirrorstream']/ul//a)[1]/@data-content`,
    );
    const componentList: string[] = $.find(
      `//div[@class='mirrorstream']/ul[@class='m${resolution}']/li`,
    )?.map?.((it: any) => it?.text());
    const registeredMediaPlayers = this.findRegisteredVideoEmbed(componentList);

    if (isNotEmpty(encodedVideoDetail)) {
      const decodedVideoDetail: OtakudesuVideoDetail = JSON.parse(
        atob(encodedVideoDetail?.value()),
      );

      return { ...decodedVideoDetail, i: registeredMediaPlayers[0] };
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

  private static findRegisteredVideoEmbed(arr: string[]) {
    return [
      'ondesu3',
      'odstream',
      'ondesuhd',
      'updesu',
      'desudesu3',
      'desudesuhd3',
      'desudrive',
      'otakuplay',
      'otakustream',
      'playdesu',
      'ondesu',
    ]
      .filter((it) => arr.includes(it))
      .map((it, i) => i);
  }
}
