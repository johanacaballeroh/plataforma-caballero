import { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    status: 'active' | 'inactive';
}

export interface AuthState {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    permissions: string[];
    companyIds: string[];
    loading: boolean;
}
