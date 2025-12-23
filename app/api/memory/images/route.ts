import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif'];

export async function GET() {
  try {
    const memoryDir = join(process.cwd(), 'public', 'memory');
    const files = await readdir(memoryDir);

    // Filter to only supported image formats (case-insensitive)
    const images = files
      .filter(file => {
        const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
      })
      .map(file => `/memory/${file}`);

    console.log(`[Memory Images] Found ${images.length} images:`, images.slice(0, 5));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading memory images:', error);
    // Return empty array if directory doesn't exist or other error
    return NextResponse.json({ images: [] });
  }
}
