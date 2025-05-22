import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import GetStarted from "./getStarted/getstarted";
import HomePage from "./homepage/homepage";
import LandingPage from "./landingpage/landingpage";
import Login from "./loginpage/login";
import FailurePage from "./Payment/FailurePage";
import PaymentPage from "./Payment/PaymentPage";
import SuccessPage from "./Payment/SuccessPage";
import Premium from "./premium/premium";
import Profile from "./profile/profile";
import SignupPage from "./signupPage/signupPage";
import TermsAndConditions from "./terms/terms";
import ContactUs from "./contactus/contactus";
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";
import ProtectedRoute from "./admin/ProtectedRoute";
import RootRoute from "./components/RootRoute";

// Pages that don't need the layout (full-screen pages)
const fullScreenPages = ['/login', '/signup', '/get-started'];

function App() {
  const isFullScreenPage = fullScreenPages.includes(window.location.pathname);

  return (
    <GoogleOAuthProvider clientId="886481282340-ua5r107135v0lc58kngkgsb0tvvb2kii.apps.googleusercontent.com">
      <Toaster position="top-right" />
      <Routes>
        {/* Full-screen pages (without layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<RootRoute />} />
        <Route path="/get-started" element={<GetStarted />} />

        {/* Pages with layout */}
        <Route
          path="/landingpage"
          element={
            <Layout>
              <LandingPage />
            </Layout>
          }
        />
        <Route
          path="/homepage"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/terms"
          element={
            <Layout>
              <TermsAndConditions />
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
        <Route
          path="/premium"
          element={
            <Layout>
              <Premium />
            </Layout>
          }
        />
        <Route
          path="/payment"
          element={
            <Layout>
              <PaymentPage />
            </Layout>
          }
        />
        <Route
          path="/failure"
          element={
            <Layout>
              <FailurePage />
            </Layout>
          }
        />
        <Route
          path="/success"
          element={
            <Layout>
              <SuccessPage />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <ContactUs />
            </Layout>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </GoogleOAuthProvider>
  );
}

export default App;
