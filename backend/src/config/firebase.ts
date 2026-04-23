import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const getServiceAccount = () => {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!sa || sa.includes('your-project-id')) {
      return null;
    }
    return JSON.parse(sa);
  } catch (error) {
    return null;
  }
};

const serviceAccount = getServiceAccount();

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin initialized.');
  } else {
    // Initializing with a dummy project ID for dev mode
    // This allows the server to start without crashing
    process.env.GCLOUD_PROJECT = 'edunexus-dev';
    admin.initializeApp({
      projectId: 'edunexus-dev',
    });
    console.warn('⚠️ Firebase running in MOCK mode. Database operations will fail until real credentials are provided in .env.');
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();
