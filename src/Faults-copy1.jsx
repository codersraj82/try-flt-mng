import React, { useEffect, useState } from "react";

function Faults() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFaults() {
      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbyP6Wh0bGGq2IF-b9jv5qT729Ii02zA6aoEfWaXOwqplkl373dkIOGvYg_1AN1kkeD0yQ/exec"
        );
        const data = await response.json();
        setFaults(data);
      } catch (error) {
        console.error("Error fetching faults:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFaults();
  }, []);

  if (loading) return <p>Loading faults...</p>;

  if (!faults.length) return <p>No faults found.</p>;

  return (
    <div style={{ marginTop: "40px", textAlign: "left", padding: "0 20px" }}>
      <h2>Fault Records</h2>
      {faults.map((row, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
            backgroundColor: "#221e1eff",
          }}
        >
          <p>
            <strong>Route:</strong>{" "}
            {row["Route name as per Transnet (from Point A to B)"]}
          </p>
          <p>
            <strong>Fault durration:</strong>{" "}
            {row["Fault durration (Hrs)"] || "N/A"}
          </p>
          <p>
            <strong>Fault in Date & Time:</strong>{" "}
            {row["Fault in Date & Time"] || "N/A"}
          </p>
          <p>
            <strong>Status of fault(carried forward/ restored):</strong>{" "}
            {row["Status of fault(carried forward/ restored)"] || "N/A"}
          </p>
          {/* Add more fields as required */}
        </div>
      ))}
    </div>
  );
}

export default Faults;
