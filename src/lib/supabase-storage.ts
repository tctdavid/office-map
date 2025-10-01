// Supabase Storage URL configuration - 自託管版本
// Centralized storage URL management for easy updates
// 請根據您的自託管 IP 地址修改此 URL

const SUPABASE_URL = "http://192.168.52.112:8000";

/**
 * Generate full URL for Supabase storage object
 * @param bucket - Storage bucket name (e.g., 'staff', 'equipment', 'pcs')
 * @param path - File path/name in the bucket
 * @returns Full URL to the storage object, or null if path is not provided
 */
export const getStorageUrl = (bucket: string, path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Already a full URL
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
};

/**
 * Generate URL for staff photos
 */
export const getStaffPhotoUrl = (photo?: string | null): string | null => {
  return getStorageUrl('staff', photo);
};

/**
 * Generate URL for equipment photos
 */
export const getEquipmentPhotoUrl = (photo?: string | null): string | null => {
  return getStorageUrl('equipment', photo);
};

/**
 * Generate URL for PC photos
 */
export const getPcPhotoUrl = (photo?: string | null): string | null => {
  return getStorageUrl('pcs', photo);
};
