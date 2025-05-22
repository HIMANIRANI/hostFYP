import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/money.svg";
import UserProfileMenu from "../components/UserProfileMenu";
import ChatContainer from "../components/ChatContainer"; 
import { useUser } from "../context/UserContext";

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:8000";

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("home"); // 👈 new
  const { user } = useUser();
  const isPremium = user?.is_premium;
  console.log('Sidebar user context:', user);

  const handlePremiumClick = () => {
    navigate("/premium");
  };

  // 👉 Define the content of each page
// This part inside LandingPage
const renderContent = () => {
  switch (currentPage) {
    case "home":
      return <ChatContainer />; // 🆕 Show ChatContainer here instead of "Welcome to Home Page"
    case "portfolio":
      return <div className="text-2xl p-6">Portfolio Management Page 📊</div>;
    case "watchlist":
      return null;
    case "chat":
      return <div className="text-2xl p-6">Chat Section Coming Soon 💬</div>; // optional
    default:
      return <div className="text-2xl p-6">Welcome to Nepse Navigator!</div>;
  }
};


  return (
    <div className="h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r p-4">
          <button
            onClick={() => setCurrentPage("home")}
            className={`flex items-center space-x-3 w-100 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 ${currentPage === "home" && "bg-gray-100"}`}
          >
            <span className="text-xl">🏠</span>
            <span className="w-full truncate">Home</span>
          </button>
          <button
            onClick={() => setCurrentPage("portfolio")}
            className={`flex items-center space-x-3 w-100  px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 ${currentPage === "portfolio" && "bg-gray-100"}`}
          >
            <span className="text-xl">📊</span>
            <span className="w-full truncate">Portfolio Management</span>
          </button>
          {!isPremium && (
            <div 
              className="mt-4 p-4 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={handlePremiumClick}
            >
              <div className="flex items-center text-yellow-600">
                <span className="text-xl mr-2">⭐</span>
                <span className="w-full truncate">Upgrade to Premium</span>
              </div>
            </div>
          )}
        </div>
        {/* Main Page Content */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
