// API 类型定义

export interface Version {
  id: number;
  name: string;
  version_num: number;  // 该 name 下的第几个版本，从 1 递增
  created_at: string;
  updated_at: string;
  content: string;
}

export interface SaveTextRequest {
  content: string;
  name: string;
}

export interface ListVersionsResponse {
  versions: Version[];
  total: number;
  limit: number;
  offset: number;
}
