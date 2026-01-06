export interface UserOperative {
  id: string;
  fullName: string;
  jobTitle: string;
  email: string;
  lastAccess: string;
  status: 'Active' | 'Inactive';
}