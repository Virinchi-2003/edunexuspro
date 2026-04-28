import admin from 'firebase-admin';

// This assumes firebase-admin is already initialized in config/firebase.ts
export const sendNotification = async (token: string, title: string, body: string, data?: any) => {
  try {
    const message = {
      notification: { title, body },
      data: data || {},
      token: token
    };
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const broadcastToRole = async (role: string, title: string, body: string) => {
  // Logic to send to all users with a specific role
  // In a real app, you'd fetch all user tokens for that role from the DB
  console.log(`Broadcasting to ${role}: ${title} - ${body}`);
};
