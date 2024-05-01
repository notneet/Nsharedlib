import { CheerioAPI } from 'cheerio';
import { isNotEmpty } from 'class-validator';
import { BASEURL_DOWNLOAD_GDRIVE } from '../constant';

export class GDriveHelper {
  private static urlDownload = new URL(BASEURL_DOWNLOAD_GDRIVE);
  constructor() {}

  static mappingPayloadFromUserContent($: CheerioAPI) {
    /** Page drive.usercontent.google.com */
    // Get value of each item. and append into download url
    const idValue = String($(`input[name='id']`).val());
    const uuidValue = String($(`input[name='uuid']`).val());
    const exportValue = String($(`input[name='export']`).val());
    const confirmValue = String($(`input[name='confirm']`).val());

    if (isNotEmpty(idValue)) {
      this.urlDownload.searchParams.append('id', idValue);
    }
    if (isNotEmpty(uuidValue)) {
      this.urlDownload.searchParams.append('uuid', uuidValue);
    }
    if (isNotEmpty(exportValue)) {
      this.urlDownload.searchParams.append('export', exportValue);
    }
    if (isNotEmpty(confirmValue)) {
      this.urlDownload.searchParams.append('confirm', confirmValue);
    }

    return this.urlDownload?.searchParams?.size > 1
      ? this.urlDownload?.toString()
      : null;
  }

  static mappingPayloadNormal(url: string) {
    /** Page drive.google.com */
    const urlVideoSplited = url.split('/');
    const idValue = urlVideoSplited[urlVideoSplited.length - 2];

    if (isNotEmpty(idValue)) {
      this.urlDownload.searchParams.append('id', idValue);
    }
    this.urlDownload.searchParams.append('export', 'download');

    return this.urlDownload?.searchParams?.size > 1
      ? this.urlDownload?.toString()
      : null;
  }
}
