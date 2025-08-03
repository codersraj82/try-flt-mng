import React, { useEffect, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInMinutes } from "date-fns";
import "./FaultForm.css";

const REQUIRED_FIELDS = [
  "Route name as per Transnet (from Point A to B)",
  "Fault in Date & Time",
  "Date & Time of Handover of fault",
  "Status of fault(carried forward/ restored)",
];

const initialFormData = {
  "Transnet DOCKET NO": "",
  "Route ID (Transnet ID)": "",
  "Route name as per Transnet (from Point A to B)": "",
  "Fault in Date & Time": "",
  "Date & Time of Handover of fault": "",
  "Date & Time of fault clearance": "",
  "Fault durration (Hrs)": "",
  "Status of fault(carried forward/ restored)": "",
  "Initial assesment (brief details of the issue)": "",
  "List of service down due to fault": "",
  "Remark if any": "",
  "FRT worked": "",
};

const apiUrl = "/.netlify/functions/fetchFaults";

function Faults() {
  const [faults, setFaults] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [faultsRes, routesRes] = await Promise.all([
          fetch(apiUrl),
          fetch(`${apiUrl}?type=routes`),
        ]);

        const faultsData = await faultsRes.json();
        const routesData = await routesRes.json();

        const filteredFaults = (
          Array.isArray(faultsData.data) ? faultsData.data : []
        ).filter((row) => REQUIRED_FIELDS.every((key) => row[key]));

        // ✅ Sort faults:
        // 1. "carried forward" status first
        // 2. Then by latest "Fault in Date & Time"
        filteredFaults.sort((a, b) => {
          const statusA =
            a["Status of fault(carried forward/ restored)"]?.toLowerCase();
          const statusB =
            b["Status of fault(carried forward/ restored)"]?.toLowerCase();

          if (statusA === "carried forward" && statusB !== "carried forward")
            return -1;
          if (statusA !== "carried forward" && statusB === "carried forward")
            return 1;

          const dateA = new Date(a["Fault in Date & Time"]);
          const dateB = new Date(b["Fault in Date & Time"]);
          return dateB - dateA; // descending: latest first
        });

        setFaults(filteredFaults);
        setRoutes(Array.isArray(routesData.data) ? routesData.data : []);
      } catch (error) {
        console.error("Error fetching fault or route data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const handleDateChange = (key, date) => {
    setFormData((prev) => ({
      ...prev,
      [key]: date ? date.toISOString() : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateFaultDuration = (row) => {
    const start = new Date(row["Date & Time of Handover of fault"]);
    const endRaw = row["Date & Time of fault clearance"];
    const status =
      row["Status of fault(carried forward/ restored)"]?.toLowerCase();
    const end = status === "restored" && endRaw ? new Date(endRaw) : new Date();
    const minutes = differenceInMinutes(end, start);
    if (isNaN(minutes)) return "Invalid";
    const days = Math.floor(minutes / 1440);
    const hours = String(Math.floor((minutes % 1440) / 60)).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    return `${days}d ${hours}:${mins}`;
  };

  const formatForSheet = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return format(d, "dd/MM/yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  const handleRouteSelect = (selectedOption) => {
    const routeName = selectedOption?.value || "";

    const matchedRoute = routes.find(
      (r) => r["Route name as per Transnet (from Point A to B)"] === routeName
    );

    setFormData((prev) => ({
      ...prev,
      "Route name as per Transnet (from Point A to B)": routeName,
      "Route ID (Transnet ID)": matchedRoute?.["Route ID"] || "",
      "List of service down due to fault":
        matchedRoute?.["Services working"] || "",
    }));
  };

  // const handleSubmit = async () => {
  //   if (!REQUIRED_FIELDS.every((key) => formData[key]?.trim())) {
  //     alert("Please fill all required fields.");
  //     return;
  //   }

  //   const payload = {
  //     ...formData,
  //     "Fault in Date & Time": formatForSheet(formData["Fault in Date & Time"]),
  //     "Date & Time of Handover of fault": formatForSheet(
  //       formData["Date & Time of Handover of fault"]
  //     ),
  //     "Date & Time of fault clearance": formatForSheet(
  //       formData["Date & Time of fault clearance"]
  //     ),
  //   };

  //   try {
  //     const response = await fetch("/.netlify/functions/submitFault", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });

  //     const result = await response.json();
  //     if (!response.ok || !result.success) throw new Error(result.error);

  //     setFaults((prev) => [...prev, payload]);
  //     setFormData(initialFormData);
  //     setEditingIndex(null);
  //   } catch (error) {
  //     console.error("Error submitting fault:", error);
  //     alert("Failed to submit fault.");
  //   }
  // };

  const handleSubmit = async () => {
    if (!REQUIRED_FIELDS.every((key) => formData[key]?.trim())) {
      alert("Please fill all required fields.");
      return;
    }

    const {
      ["Fault durration (Hrs)"]: _, // exclude from payload
      ...cleanedFormData
    } = formData;

    const payload = {
      ...cleanedFormData,
      "Fault in Date & Time": formatForSheet(
        cleanedFormData["Fault in Date & Time"]
      ),
      "Date & Time of Handover of fault": formatForSheet(
        cleanedFormData["Date & Time of Handover of fault"]
      ),
      "Date & Time of fault clearance": formatForSheet(
        cleanedFormData["Date & Time of fault clearance"]
      ),
    };

    try {
      const response = await fetch("/.netlify/functions/submitFault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error);

      const updatedFaults = [...faults];

      if (editingIndex !== null) {
        // Replace the existing record
        updatedFaults[editingIndex] = payload;
      } else {
        // Add new record
        updatedFaults.push(payload);
      }

      // ✅ Sort the updated list
      updatedFaults.sort((a, b) => {
        const statusA =
          a["Status of fault(carried forward/ restored)"]?.toLowerCase();
        const statusB =
          b["Status of fault(carried forward/ restored)"]?.toLowerCase();

        if (statusA === "carried forward" && statusB !== "carried forward")
          return -1;
        if (statusA !== "carried forward" && statusB === "carried forward")
          return 1;

        const dateA = new Date(a["Fault in Date & Time"]);
        const dateB = new Date(b["Fault in Date & Time"]);
        return dateB - dateA;
      });

      setFaults(updatedFaults);
      setFormData(initialFormData);
      setEditingIndex(null);
    } catch (error) {
      console.error("Error submitting fault:", error);
      alert("Failed to submit fault.");
    }
  };

  const handleEdit = (index) => {
    setFormData({ ...faults[index] });
    setEditingIndex(index);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (rowNumber) => {
    if (!window.confirm("Are you sure to delete this fault?")) return;
    try {
      const response = await fetch("/.netlify/functions/submitFault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, action: "delete" }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Delete failed on backend.");
      }

      setFaults((prev) => prev.filter((row) => row.rowNumber !== rowNumber));
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete the fault from Google Sheet.");
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [faultsRes, routesRes] = await Promise.all([
        fetch(apiUrl),
        fetch(`${apiUrl}?type=routes`),
      ]);

      const faultsData = await faultsRes.json();
      const routesData = await routesRes.json();

      let filteredFaults = (
        Array.isArray(faultsData.data) ? faultsData.data : []
      ).filter((row) => REQUIRED_FIELDS.every((key) => row[key]));

      // Apply sorting logic: carried forward first, then latest
      filteredFaults.sort((a, b) => {
        const aStatus =
          a["Status of fault(carried forward/ restored)"]?.toLowerCase() || "";
        const bStatus =
          b["Status of fault(carried forward/ restored)"]?.toLowerCase() || "";
        const aDate = new Date(a["Date & Time of Handover of fault"]);
        const bDate = new Date(b["Date & Time of Handover of fault"]);

        if (aStatus === "carried forward" && bStatus !== "carried forward")
          return -1;
        if (aStatus !== "carried forward" && bStatus === "carried forward")
          return 1;
        return bDate - aDate; // Newest first hi
      });

      setFaults(filteredFaults);
      setRoutes(Array.isArray(routesData.data) ? routesData.data : []);
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert("Failed to refresh data.");
    } finally {
      setLoading(false);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#1e1e1e",
      borderColor: "#555",
      color: "#fff",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1e1e1e",
      color: "#fff",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#333" : "#1e1e1e",
      color: "#fff",
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#fff",
    }),
    input: (base) => ({
      ...base,
      color: "#fff",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#aaa",
    }),
  };

  return (
    <div style={{ marginTop: "40px", padding: "0 20px" }}>
      <h2>{formData.rowNumber ? "Edit Fault" : "Add Fault"}</h2>
      <div className="fault-form-container">
        {Object.keys(initialFormData)
          .filter((key) => key !== "rowNumber")
          .map((key) => (
            <div key={key} className="fault-form-group">
              <label>{key}</label>
              {key === "Route name as per Transnet (from Point A to B)" ? (
                <Select
                  name={key}
                  classNamePrefix="react-select"
                  styles={customSelectStyles}
                  options={routes.map((route) => ({
                    label: route[key],
                    value: route[key],
                  }))}
                  value={
                    formData[key]
                      ? { label: formData[key], value: formData[key] }
                      : null
                  }
                  onChange={handleRouteSelect}
                  isClearable
                />
              ) : [
                  "Fault in Date & Time",
                  "Date & Time of Handover of fault",
                  "Date & Time of fault clearance",
                ].includes(key) ? (
                <DatePicker
                  selected={formData[key] ? new Date(formData[key]) : null}
                  onChange={(date) => handleDateChange(key, date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  placeholderText="Select date & time"
                  className="form-control"
                  wrapperClassName="date-picker-wrapper"
                />
              ) : key === "Status of fault(carried forward/ restored)" ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Select status</option>
                  <option value="carried forwarded">carried forwarded</option>
                  <option value="restored">restored</option>
                </select>
              ) : key === "FRT worked" ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Select FRT</option>
                  <option value="FRT-1 Lohar">FRT-1 Lohar</option>
                  <option value="FRT-2 Mujjim">FRT-2 Mujjim</option>
                  <option value="FRT-3 Maruti">FRT-3 Maruti</option>
                </select>
              ) : (
                <input
                  type="text"
                  name={key}
                  value={formData[key] || ""}
                  onChange={handleChange}
                  disabled={
                    key === "Fault durration (Hrs)" ||
                    key === "Route ID (Transnet ID)"
                  }
                />
              )}
            </div>
          ))}
        <button onClick={handleSubmit} className="fault-form-button">
          {formData.rowNumber ? "Update" : "Add"} Fault
        </button>
      </div>

      <h2>Fault Records</h2>
      {loading ? (
        <p>Loading faults...</p>
      ) : !faults.length ? (
        <p>No faults found.</p>
      ) : (
        faults.map((row, index) => {
          const status =
            row["Status of fault(carried forward/ restored)"]?.toLowerCase();
          const headerColor =
            status === "restored"
              ? "#2ecc71"
              : status === "carried forward"
              ? "#e74c3c"
              : "#7f8c8d";

          return (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                marginBottom: "15px",
                overflow: "hidden",
                backgroundColor: "#221e1eff",
                color: "white",
              }}
            >
              <div style={{ backgroundColor: headerColor, padding: "10px" }}>
                <strong>
                  {row["Route name as per Transnet (from Point A to B)"] ||
                    "Unnamed Route"}
                </strong>
              </div>
              <div style={{ padding: "10px" }}>
                <p>
                  <strong>Handover Time:</strong>{" "}
                  {formatDate(row["Date & Time of Handover of fault"])}
                </p>
                <p>
                  <strong>Fault Duration:</strong> {calculateFaultDuration(row)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {row["Status of fault(carried forward/ restored)"]}
                </p>
                <p>
                  <strong>FRT Worked:</strong> {row["FRT worked"]}
                </p>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button onClick={() => handleEdit(index)}>Edit</button>
                  <button onClick={() => handleDelete(row.rowNumber)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
      <button
        onClick={refreshData}
        title="Refresh Data"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          fontSize: "18px",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          zIndex: 9999,
        }}
      >
        ⟳
      </button>
    </div>
  );
}

export default Faults;
