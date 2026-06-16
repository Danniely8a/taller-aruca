import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const loginUser = async (correo, contrasena) => {
    const res = await auth.login({ correo, contrasena });
    setUser(res.data.user);
    return res.data;
  };

  const logoutUser = async () => {
    await auth.logout();
    setUser(null);
  };

  const hasPermission = (...roles) => {
    return user && roles.includes(user.rol);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
