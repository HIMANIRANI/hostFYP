import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

const PaymentSuccess = () => {
  const [search] = useSearchParams();
  const dataQuery = search.get("data");
  const [data, setData] = useState({});

  useEffect(() => {
    if (dataQuery) {
      try {
        const resData = atob(dataQuery);
        const resObject = JSON.parse(resData);
        
        // Enhanced console logging
        console.log("eSewa Payment Success Details:", {
          decodedData: resObject,
          rawData: dataQuery,
          timestamp: new Date().toISOString(),
          paymentMethod: "eSewa",
          transactionDetails: {
            amount: resObject.total_amount,
            transactionId: resObject.transaction_uuid,
            productCode: resObject.product_code
          }
        });

        setData(resObject);
      } catch (error) {
        console.error("Error processing payment data:", error);
      }
    }
  }, [dataQuery]);

  return (
    <div className="payment-container">
      <img src="src/check.png" alt="" />
      <p className="price">Rs. {data.total_amount}</p>
      <p className="status">Payment Successful</p>
    </div>
  );
};

export default PaymentSuccess;