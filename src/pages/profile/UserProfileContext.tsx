import { createContext, useContext, type FC, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { GetMeResponse } from '@/api/Api';
import {
  useLogoutUser,
  useGetUserProfile,
  useCreateUser,
  useLoginUser,
} from '@/api/Api';

type UserProfileContextType = {
  userProfile?: GetMeResponse;
  createUserProfile: (
    username: string,
    email: string,
  ) => Promise<{ message: string }>;
  loginUserProfile: (email: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  isLoading: boolean;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined,
);

type Props = {
  children: ReactNode;
};

export const UserProfileProvider: FC<Props> = ({ children }) => {
  const { data, isLoading, refetch: refetchUserProfile } = useGetUserProfile();
  const loginMutation = useLoginUser();
  const logoutMutation = useLogoutUser();
  const createUserMutation = useCreateUser();
  const navigate = useNavigate();

  async function reloadUser() {
    await refetchUserProfile();
  }

  const createUserProfile = async (username: string, email: string) => {
    return await createUserMutation
      .mutateAsync({ username, email })
      .catch(() => {
        throw new Error('Email and Username must be unique');
      });
  };

  const loginUserProfile = async (email: string) => {
    return loginMutation.mutateAsync(email).catch(() => {
      throw new Error('Invalid login');
    });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync().then(() => {
      reloadUser();
      navigate({ to: '/app/login' });
    });
  };

  const contextData: UserProfileContextType = {
    userProfile: data,
    createUserProfile,
    loginUserProfile,
    logout,
    reloadUser,
    isLoading,
  };

  return (
    <UserProfileContext.Provider value={contextData}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a UserProfileProvider');
  }
  return context;
};
