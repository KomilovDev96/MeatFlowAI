import { Input, Space, Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type DataTableProps<T extends object> = {
  data: T[];
  columns: ColumnsType<T>;
  rowKey: TableProps<T>['rowKey'];
  searchKeys?: Array<keyof T>;
};

export function DataTable<T extends object>({ data, columns, rowKey, searchKeys = [] }: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search) return data;
    const needle = search.toLowerCase();
    return data.filter((item) => searchKeys.some((key) => String(item[key] ?? '').toLowerCase().includes(needle)));
  }, [data, search, searchKeys]);

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Input prefix={<Search size={16} />} placeholder="Search" allowClear value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="responsive-table">
        <Table columns={columns} dataSource={filtered} rowKey={rowKey} pagination={{ pageSize: 10 }} />
      </div>
    </Space>
  );
}
