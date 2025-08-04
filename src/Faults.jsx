// ... All imports stay unchanged
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
  const [showForm, setShowForm] = useState(false); // ✅ NEW

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
          return dateB - dateA;
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

  const handleSubmit = async () => {
    if (!REQUIRED_FIELDS.every((key) => formData[key]?.trim())) {
      alert("Please fill all required fields.");
      return;
    }

    const { ["Fault durration (Hrs)"]: _, ...cleanedFormData } = formData;

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
      if (editingIndex !== null) updatedFaults[editingIndex] = payload;
      else updatedFaults.push(payload);

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
      setShowForm(false); // ✅ hide form
    } catch (error) {
      console.error("Error submitting fault:", error);
      alert("Failed to submit fault.");
    }
  };

  const handleEdit = (index) => {
    setFormData({ ...faults[index] });
    setEditingIndex(index);
    setShowForm(true); // ✅ show form on edit
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
      if (!response.ok || !result.success) throw new Error(result.error);
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
        return bDate - aDate;
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
    singleValue: (base) => ({ ...base, color: "#fff" }),
    input: (base) => ({ ...base, color: "#fff" }),
    placeholder: (base) => ({ ...base, color: "#aaa" }),
  };

  return (
    <div style={{ marginTop: "40px", padding: "0 20px" }}>
      {!showForm && (
        <button
          className="fault-form-button"
          onClick={() => {
            setFormData(initialFormData);
            setEditingIndex(null);
            setShowForm(true);
          }}
        >
          + Add Fault
        </button>
      )}

      {showForm && (
        <>
          <h2>{formData.rowNumber ? "Edit Fault" : "Add Fault"}</h2>
          <div className="fault-form-container">
            {/* ... your existing form inputs unchanged ... */}
            {/* inside your form loop and buttons remain as-is */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleSubmit} className="fault-form-button">
                {formData.rowNumber ? "Update" : "Add"} Fault
              </button>
              <button
                onClick={() => {
                  setFormData(initialFormData);
                  setEditingIndex(null);
                  setShowForm(false); // ✅ hide form on cancel
                }}
                className="fault-form-button"
                style={{ backgroundColor: "#888" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <h2>Fault Records</h2>
      {/* ... your card rendering and refresh button stay unchanged ... */}
    </div>
  );
}

export default Faults;
