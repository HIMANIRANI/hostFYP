// frontend/src/components/EsewaPayment.jsx
import axios from "axios";
import React, { useState } from "react";

export default function EsewaPayment({ amount, productName, transactionId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:8000/api/initiate-payment", {
        method: "esewa",
        amount: amount.toString(),
        product_name: productName,
        transaction_id: transactionId,
      });

      const { esewa_config } = response.data;

      // Ensure the success URL is set correctly
      esewa_config.success_url = "http://localhost:5173/success?method=esewa";

      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

      Object.entries(esewa_config).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err) {
      setError("Payment initiation failed. Please try again.");
      console.error("Payment Error:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 w-full max-w-md">
      <h2 className="text-lg font-bold mb-4 text-gray-800">eSewa Payment</h2>
      <p className="text-gray-600 mb-4">Enter payment details for eSewa</p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (NPR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => e.preventDefault()} // Disable editing for consistency
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => e.preventDefault()} // Disable editing for consistency
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => e.preventDefault()} // Disable editing for consistency
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled
          />
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 mt-4"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Pay with eSewa"}
        </button>
      </form>
    </div>
  );
}
