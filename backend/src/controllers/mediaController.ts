import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { storage, isMockMode } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  const file = req.file;
  const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
  
  if (isMockMode) {
    // In mock mode, return a dummy URL
    console.warn('⚠️ Mock upload: returning local preview URL');
    return res.status(200).json({
      status: 'success',
      data: {
        url: `https://placeholder.com/${fileName}`,
        name: file.originalname,
        type: file.mimetype.split('/')[0] === 'application' ? 'document' : file.mimetype.split('/')[0]
      }
    });
  }

  const bucket = storage.bucket();
  const blob = bucket.file(`messaging/${fileName}`);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    resumable: false,
  });

  blobStream.on('error', (err) => {
    res.status(500).json({ status: 'error', message: err.message });
  });

  blobStream.on('finish', async () => {
    // Make the file public or get a signed URL
    // For simplicity, we'll use a public URL if the bucket allows it
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    
    res.status(200).json({
      status: 'success',
      data: {
        url: publicUrl,
        name: file.originalname,
        type: file.mimetype.split('/')[0] === 'application' ? 'document' : file.mimetype.split('/')[0]
      }
    });
  });

  blobStream.end(file.buffer);
});
