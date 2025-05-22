import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import logo from "../assets/money.svg";

const SignupPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
        });
        navigate("/login");
      } else {
        if (result.detail && typeof result.detail === 'string' && result.detail.includes("already exists")) {
          toast.error("User already exists. Please try logging in.");
        } else {
          const errorMessage = result.detail 
            ? (Array.isArray(result.detail) 
                ? result.detail.map(err => err.msg).join(", ")
                : result.detail)
            : "Something went wrong!";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error("Failed to create an account. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (response) => {
    console.log("Google Login Response:", response);

    try {
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      console.log("Decoded User Info:", payload);

      const googleAuthData = {
        firstName: payload.given_name || "GoogleUser",
        lastName: payload.family_name || "User",
        email: payload.email,
        password: "google_oauth_placeholder",
        confirmPassword: "google_oauth_placeholder",
      };

      await handleSignup(googleAuthData);
    } catch (error) {
      console.error("Error posting to backend:", error);
      toast.error("Failed to log in with Google. Please try again later.");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-center py-8">
        <img src={logo} alt="NEPSE Navigator Logo" className="h-64 w-64 mb-8" />
        <div className="text-4xl font-bold text-customBlue text-center px-4">
          Join NEPSE Navigator Today
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-customBlue flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Create your account</h2>
          
          <form className="space-y-6" onSubmit={handleSignup}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white">
                  First Name
                </label>
            <input
              type="text"
              name="firstName"
                  id="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-white focus:ring-white sm:text-sm px-4 py-2 ${
                    errors.firstName ? 'border-red-500' : ''
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-300">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-white">
                  Last Name
                </label>
            <input
              type="text"
              name="lastName"
                  id="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-white focus:ring-white sm:text-sm px-4 py-2 ${
                    errors.lastName ? 'border-red-500' : ''
                  }`}
            />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-300">{errors.lastName}</p>
                )}
              </div>
          </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email address
              </label>
          <input
            type="email"
            name="email"
                id="email"
            value={formData.email}
            onChange={handleInputChange}
                className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-white focus:ring-white sm:text-sm px-4 py-2 ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="relative">
          <input
                  type={showPassword ? "text" : "password"}
            name="password"
                  id="password"
            value={formData.password}
            onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-white focus:ring-white sm:text-sm px-4 py-2 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                Confirm Password
              </label>
              <div className="relative">
          <input
                  type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
                  id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-white focus:ring-white sm:text-sm px-4 py-2 ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-300">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center">
            <input
              type="checkbox"
              name="agreeToTerms"
                id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
                className="h-4 w-4 text-customBlue focus:ring-white border-gray-300 rounded"
            />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-white">
              I agree to the{" "}
                <a href="/terms" className="text-white hover:text-gray-200 underline">
                  Terms and Conditions
                </a>
            </label>
          </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-300">{errors.agreeToTerms}</p>
            )}

            <div>
          <button
            type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-gray-800 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
          >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
            </div>
          </form>

          {/* Add login link */}
          <div className="mt-6 text-center">
            <p className="text-white">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-yellow-300 hover:text-yellow-200 font-semibold underline"
              >
                Login here
              </button>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-customBlue text-white">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
                onError={() => toast.error("Google signup failed")}
                theme="filled_white"
                text="signup_with"
                shape="rectangular"
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
