export interface AdminSearchField {
  value: string;
  label: string;
}

export interface AdminListQuery {
  search: string;
  searchField: string;
  page: number;
  pageSize: number;
}
