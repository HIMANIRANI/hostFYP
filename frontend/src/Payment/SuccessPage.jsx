import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useUser();
  let method = searchParams.get("method");
  let data = searchParams.get("data");

  // Patch for malformed ?method=esewa?data=... URL
  if (method && method.includes("?data=")) {
    const [realMethod, realData] = method.split("?data=");
    method = realMethod;
    data = realData;
  }

  useEffect(() => {
    // Log the payment success response
    console.log("Payment Success Response:", {
      method,
      data: data ? JSON.parse(atob(data)) : null,
      rawData: data,
      timestamp: new Date().toISOString()
    });

    // If eSewa payment, mark user as premium
    if (method === "esewa") {
      const token = localStorage.getItem("access_token");
      if (token) {
        axios.post("http://localhost:8000/api/mark-premium", {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => fetchUser())
        .catch(err => {
          console.error("Error marking user as premium or refreshing profile:", err);
        });
      }
    }
  }, [method, data, fetchUser]);

  const handleReturnHome = () => {
    navigate("/premium"); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 w-full max-w-md">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-green-500">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
          
          <button
            onClick={handleReturnHome}
            className="mt-6 w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
