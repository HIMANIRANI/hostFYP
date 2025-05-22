import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/money.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!loginData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!loginData.password) {
      newErrors.password = "Password is required";
    } else if (loginData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting login with:", loginData);

      const response = await axios.post(
        "http://localhost:8000/auth/login",
        {
          email: loginData.email,
          password: loginData.password,
        },
        {
          withCredentials: true,
        }
      );

      console.log("Login response after post:", response.data);

      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);

        if (response.data.user) {
          localStorage.setItem("user_profile", JSON.stringify(response.data.user));
        }

        toast.success("Login successful!");
        navigate("/homepage");
      } else {
        console.error("No access token in response:", response.data);
        toast.error("Login failed - no access token received");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        toast.error(error.response.data?.detail || error.response.data || 'Server error');
      } else if (error.request) {
        toast.error("No response from server. Please check if the server is running.");
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      console.error("No Google credential found");
      toast.error("Google login failed - no credential received");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/google-login",
        {
          credential: credentialResponse.credential,
        },
        {
          withCredentials: true,
        }
      );

      console.log("Google login response:", response.data);

      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);

        if (response.data.user) {
          localStorage.setItem("user_profile", JSON.stringify(response.data.user));
        }

        toast.success("Google login successful!");
        navigate("/homepage");
      } else {
        console.error("No access token received from Google login");
        toast.error("Google login failed - no access token received");
      }
    } catch (error) {
      console.error("Google login error:", error.response?.data || error.message);
      toast.error(error.response?.data?.detail || "Google login failed");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-center">
        <img src={logo} alt="NEPSE Navigator Logo" />
        <div className="text-4xl font-bold text-customBlue mb-4 text-center">
          Navigating the Nepal Stock Exchange with Ease
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-customBlue flex flex-col justify-center items-center">
        <div className="text-white text-3xl font-semibold mb-4">Welcome Back!</div>
        <p className="text-white text-sm mb-6">Please Enter Your Details</p>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} className="w-3/4 flex flex-col gap-4">
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 bg-white text-customBlue rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 ${
                errors.email ? 'border-2 border-red-500' : ''
              }`}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 bg-white text-customBlue rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 ${
                errors.password ? 'border-2 border-red-500' : ''
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-white mt-4">Or Login With</div>

        {/* Google Login Button */}
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => toast.error("Google login failed")}
        />

        {/* Sign Up Link */}
        <div className="mt-6 text-white">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-yellow-400 hover:text-yellow-300 font-semibold underline"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
