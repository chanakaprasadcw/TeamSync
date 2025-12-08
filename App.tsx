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

  // Routing Logic based on Hierarchy
  if (currentUser.role === UserRole.ADMIN) {
    return <AdminView />;
  }

  // Management roles who can assign tasks
  if (
    currentUser.role === UserRole.MANAGER || 
    currentUser.role === UserRole.ASSISTANT_MANAGER || 
    currentUser.role === UserRole.TEAM_LEAD
  ) {
    return <ManagerView />;
  }

  // Everyone else (Engineer, Tech, Intern)
  return <EmployeeView />;
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Main />
    </StoreProvider>
  );
};

export default App;