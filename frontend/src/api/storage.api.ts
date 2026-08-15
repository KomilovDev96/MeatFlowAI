import axios from 'axios';
import { apiClient } from './client';

export type UploadFolder = 'avatars' | 'logos' | 'products';

type UploadUrlResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export const storageApi = {
  getUploadUrl: async (filename: string, contentType: string, folder: UploadFolder) =>
    (await apiClient.post<UploadUrlResponse>('/storage/upload-url', { filename, contentType, folder })).data,

  uploadFile: async (file: File, folder: UploadFolder) => {
    const { uploadUrl, publicUrl } = await storageApi.getUploadUrl(file.name, file.type, folder);
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
    return publicUrl;
  },
};
