import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/money.svg";

const GetStarted = () => {
  return (
    <div className="flex h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-center py-8">
        <img src={logo} alt="NEPSE Navigator Logo" className="h-64 w-64 mb-8" />
        <div className="text-4xl font-bold text-customBlue text-center px-4">
          Navigating the Nepal Stock Exchange with Ease
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-customBlue flex flex-col justify-center items-center">
        <div className="text-white text-3xl font-semibold mb-8">Get Started</div>
        <div className="flex flex-col gap-4">
          {/* Login Button */}
          <Link
            to="/login"
            className="w-40 px-12 py-2 bg-white text-customBlue font-medium rounded-lg hover:bg-gray-100 transition duration-300 text-center"
          >
            Login
          </Link>

          {/* Sign-up Button */}
          <Link
            to="/signup"
            className="w-40 px-12 py-2 bg-white text-customBlue font-medium rounded-lg hover:bg-gray-100 transition duration-300 text-center"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
