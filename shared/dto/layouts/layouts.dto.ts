export interface LayoutDataDto {
  layouts: Record<string, any>;
  extraCards: any[];
  cardTitles: Record<string, string>;
  cardConfigs: Record<string, { chartType: string; dataSource: string }>;
  hiddenCards: string[];
}

export interface SaveLayoutDto {
  data: LayoutDataDto;
}
