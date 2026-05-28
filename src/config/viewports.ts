export type ViewportConfig = {
  name: string;
  width: number;
  height: number;
};

export const defaultViewports: ViewportConfig[] = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];
