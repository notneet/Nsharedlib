export type ExtractUrlProps = {
  url: string;
  resolution?: '360p' | '480p' | '720p' | '1080p' | '1440p';
};

export type OtakudesuVideoDetail = {
  id: number;
  i: number;
  q: string;
};

export interface OtakudesuVideoPayload {
  id: number;
  i: number;
  q: string;
  nonce: string;
  action: string;
}
