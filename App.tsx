import React from 'react';
import { StoreProvider, useStore } from './services/store';
import { LoginView } from './views/Login';
import { AdminView } from './views/AdminView';
import { ManagerView } from './views/ManagerView';
import { EmployeeView } from './views/EmployeeView';
import { UserRole } from './types';

const Main: React.FC = () => {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <LoginView />;
  }

  switch (currentUser.role) {
    case UserRole.ADMIN:
      return <AdminView />;
    case UserRole.MANAGER:
      return <ManagerView />;
    case UserRole.EMPLOYEE:
      return <EmployeeView />;
    default:
      return <LoginView />;
  }
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Main />
    </StoreProvider>
  );
};

export default App;