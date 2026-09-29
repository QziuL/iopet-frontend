import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Converts an image picker asset into a persistent Data URI (base64)
 * that can be safely stored in the database.
 */
export async function assetToDataUrl(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }

  // Fallback for web or platforms where base64 might not be precomputed
  if (Platform.OS === 'web' && asset.uri.startsWith('blob:')) {
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return asset.uri;
    }
  }

  return asset.uri;
}

/**
 * Standard image picker launcher configured for avatar photos:
 * 1:1 aspect ratio, compressed quality (0.5), base64 enabled.
 */
export async function pickProfileImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão negada para acessar galeria de fotos.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return assetToDataUrl(result.assets[0]);
}
