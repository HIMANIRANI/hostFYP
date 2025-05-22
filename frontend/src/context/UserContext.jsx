import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user_profile");
    return stored ? JSON.parse(stored) : null;
  });

  const fetchUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:8000/api/profile/get", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      localStorage.setItem("user_profile", JSON.stringify(res.data));
    } catch (e) {
      // handle error
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}; 