// Supabase Storage URL configuration
// Centralized storage URL management for easy updates

const SUPABASE_URL = "https://ivhyhwjmseubvwqbvajb.supabase.co";

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
