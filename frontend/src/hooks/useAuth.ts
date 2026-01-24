import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { login, logout, getCurrentUser, clearError } from '../store/slices/authSlice';
import { LoginCredentials, UserRole } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(login(credentials));
      if (login.fulfilled.match(result)) {
        navigate('/dashboard');
        return true;
      }
      return false;
    },
    [dispatch, navigate]
  );

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const refreshUser = useCallback(async () => {
    await dispatch(getCurrentUser());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  const isSpecialist = user?.role === 'SPECIALIST';
  const isTeamManager = user?.role === 'TEAM_MANAGER';
  const isComplianceOfficer = user?.role === 'COMPLIANCE_OFFICER';
  const isAdmin = user?.role === 'ADMIN';
  const canApprove = isTeamManager || isComplianceOfficer || isAdmin;

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
    clearError: handleClearError,
    hasRole,
    isSpecialist,
    isTeamManager,
    isComplianceOfficer,
    isAdmin,
    canApprove,
  };
};

export default useAuth;
