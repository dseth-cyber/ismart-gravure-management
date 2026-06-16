export interface SystemSettingDto {
  key: string;
  value: string;
  updatedAt?: string;
}

export interface SaveSystemSettingDto {
  key: string;
  value: string;
}
