import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export const MEAL_PHOTOS_BUCKET = 'meal-photos';

export async function uploadMealPhotoBase64(
  userId: string,
  dateStr: string,
  slotIndex: number,
  base64Image: string,
  extension: string = 'jpeg'
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const fileName = `${userId}/${dateStr}/${slotIndex}_${timestamp}.${extension}`;

    const { error } = await supabase.storage
      .from(MEAL_PHOTOS_BUCKET)
      .upload(fileName, decode(base64Image), {
        contentType: `image/${extension}`,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    return fileName;
  } catch (err) {
    console.error('Error uploading meal photo:', err);
    return null;
  }
}
