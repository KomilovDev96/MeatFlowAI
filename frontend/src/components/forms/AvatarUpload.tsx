import { LoadingOutlined } from '@ant-design/icons';
import { App, Avatar, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storageApi, type UploadFolder } from '../../api/storage.api';

export function AvatarUpload({
  value,
  onChange,
  folder,
  shape = 'circle',
}: {
  value?: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  shape?: 'circle' | 'square';
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    setLoading(true);
    try {
      const publicUrl = await storageApi.uploadFile(file, folder);
      onChange(publicUrl);
    } catch {
      message.error(t('common.uploadFailed'));
    } finally {
      setLoading(false);
    }
    return false;
  };

  return (
    <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload} maxCount={1}>
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar shape={shape} size={64} src={value || undefined} icon={!value ? <Camera size={24} /> : undefined} />
        <span>{loading ? <LoadingOutlined /> : value ? t('common.changeImage') : t('common.uploadImage')}</span>
      </div>
    </Upload>
  );
}
