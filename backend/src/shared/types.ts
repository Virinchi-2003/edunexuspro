export type UserRole = 'admin' | 'principal' | 'staff' | 'student' | 'parent' | 'coach';
export type SubscriptionPlan = 'starter' | 'growth' | 'pro' | 'elite';
export const SHARED_VERSION = '1.0.0';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  schoolId?: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: any;
}

export interface School {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  subscriptionPlan: SubscriptionPlan;
  status: 'active' | 'suspended' | 'pending';
  createdAt: any;
  updatedAt: any;
  settings: {
    currency: string;
    timezone: string;
    language: string;
  };
}
