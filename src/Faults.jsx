import React, { useEffect, useState } from "react";
import Select from "react-select";
import fetchFaults from "../netlify/functions/fetchFaults";
import fetchRoutes from "../netlify/functions/fetchFaults";

const REQUIRED_FIELDS = [
  "Route name as per Transnet (from Point A to B)",
  "Fault in Date & Time",
  "Date & Time of Handover of fault",
  "Status of fault(carried forward/ restored)",
];

const initialFormData = {
  "Transnet DOCKET NO": "",
  "Route name as per Transnet (from Point A to B)": "",
  "Fault in Date & Time": "",
  "Date & Time of Handover of fault": "",
  "Status of fault(carried forward/ restored)": "",
  Remarks: "",
};

const Faults = () => {
  const [faults, setFaults] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const faultData = await fetchFaults();
        const routeData = await fetchRoutes();
        setFaults(faultData);
        setRoutes(routeData);
      } catch (err) {
        setError("Failed to fetch fault or route data");
        console.error("Error fetching fault or route data:", err);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ textAlign: "center" }}>Fault Reporting</h2>

      {/* Form */}
      <form style={{ marginBottom: "2rem" }}>
        {Object.keys(formData).map((key) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              {key}{" "}
              {REQUIRED_FIELDS.includes(key) && (
                <span style={{ color: "red" }}>*</span>
              )}
            </label>

            {key === "Route name as per Transnet (from Point A to B)" ? (
              <Select
                options={routes.map((route) => ({
                  label:
                    route["Route name as per Transnet (from Point A to B)"],
                  value:
                    route["Route name as per Transnet (from Point A to B)"],
                }))}
                value={
                  formData[key]
                    ? {
                        label: formData[key],
                        value: formData[key],
                      }
                    : null
                }
                onChange={(selectedOption) =>
                  handleChange({
                    target: {
                      name: key,
                      value: selectedOption ? selectedOption.value : "",
                    },
                  })
                }
                isClearable
                placeholder="Select or search route..."
                styles={{
                  control: (provided) => ({
                    ...provided,
                    backgroundColor: "#fff",
                    borderRadius: "5px",
                    border: "1px solid #888",
                    padding: "1px",
                  }),
                }}
              />
            ) : (
              <input
                type={
                  key.toLowerCase().includes("date") ? "datetime-local" : "text"
                }
                name={key}
                value={formData[key] || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #888",
                }}
              />
            )}
          </div>
        ))}
      </form>

      {/* Display Fault Cards */}
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        faults
          .sort((a, b) => {
            const dateA = new Date(a["Fault in Date & Time"]);
            const dateB = new Date(b["Fault in Date & Time"]);
            return dateB - dateA;
          })
          .map((fault, index) => (
            <div
              key={fault.rowNumber || index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "1rem",
                marginBottom: "1rem",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>
                {fault["Route name as per Transnet (from Point A to B)"]}
              </h3>
              <p>
                <strong>DOCKET NO:</strong> {fault["Transnet DOCKET NO"]}
              </p>
              <p>
                <strong>Fault in:</strong> {fault["Fault in Date & Time"]}
              </p>
              <p>
                <strong>Handover:</strong>{" "}
                {fault["Date & Time of Handover of fault"]}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {fault["Status of fault(carried forward/ restored)"]}
              </p>
              <p>
                <strong>Remarks:</strong> {fault["Remarks"]}
              </p>
              <p>
                <strong>Row #:</strong> {fault.rowNumber}
              </p>
            </div>
          ))
      )}
    </div>
  );
};

export default Faults;
