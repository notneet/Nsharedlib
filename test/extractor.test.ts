import { ExtractorUrl } from '../src/index';

describe('Test ExtractorUrl', () => {
  let extractorUrl: ExtractorUrl;

  beforeEach(() => {
    extractorUrl = new ExtractorUrl();
  });

  describe('[Gdrive Extractor]', () => {
    it('Origin drive.usercontent.google.com @Positive', async () => {
      const result = await extractorUrl.extractUrlGdrive({
        url: 'https://drive.usercontent.google.com/download?id=1eUMrsALwTNldKJC8K2waG_OTrf69XHfo&export=download',
      });
      // console.log(result);

      expect(result).toBeDefined();
    });

    it('Origin drive.usercontent.google.com @Negative', async () => {
      const result = await extractorUrl.extractUrlGdrive({
        url: 'https://drive.usercontent.google.com/download?id=1eUMrsALwTNxdKJC8K2waG_OTrf69XHfo&export=download',
      });

      expect(result).toBeNull();
    });

    it('Origin drive.google.com @Positive', async () => {
      const result = await extractorUrl.extractUrlGdrive({
        url: 'https://drive.google.com/file/d/1TaMbh0pot3jFbUFyGcBvtL0GDFNSxOup/edit',
      });
      // console.log(result);

      expect(result).toBeDefined();
    });

    it('Origin drive.google.com @Negative', async () => {
      const result = await extractorUrl.extractUrlGdrive({
        url: 'https://drive.google.com/file/d/1TaMxh0pot3jFbUFyGcBvtL0GDFNSxOup/edit',
      });

      expect(result).toBeNull();
    });
  });

  describe('[Otakudesu Extractor]', () => {
    //
  });
});
