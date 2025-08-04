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

// ⬆️ Your imports and constants remain the same...

// ⬆️ Your imports and constants remain the same...

function Faults() {
  const [faults, setFaults] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showForm, setShowForm] = useState(false); // 👈 NEW

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
          return (
            new Date(b["Fault in Date & Time"]) -
            new Date(a["Fault in Date & Time"])
          );
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

  // ⬇️ handleSubmit updated to hide form
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
        return (
          new Date(b["Fault in Date & Time"]) -
          new Date(a["Fault in Date & Time"])
        );
      });

      setFaults(updatedFaults);
      setFormData(initialFormData);
      setEditingIndex(null);
      setShowForm(false); // 👈 hide form
    } catch (error) {
      console.error("Error submitting fault:", error);
      alert("Failed to submit fault.");
    }
  };

  const handleEdit = (index) => {
    setFormData({ ...faults[index] });
    setEditingIndex(index);
    setShowForm(true); // 👈 show form on edit
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ marginTop: "40px", padding: "0 20px" }}>
      {/* Toggle Add Fault Button */}
      {!showForm && (
        <button
          className="fault-form-button"
          onClick={() => {
            setFormData(initialFormData);
            setEditingIndex(null);
            setShowForm(true); // 👈 show form on click
          }}
        >
          + Add Fault
        </button>
      )}

      {showForm && (
        <>
          <h2>{formData.rowNumber ? "Edit Fault" : "Add Fault"}</h2>
          <div className="fault-form-container">
            {/* ⬇️ All your form fields and logic stays as-is */}
            {/* ⬇️ End of form */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleSubmit} className="fault-form-button">
                {formData.rowNumber ? "Update" : "Add"} Fault
              </button>
              <button
                onClick={() => {
                  setFormData(initialFormData);
                  setEditingIndex(null);
                  setShowForm(false); // 👈 hide form on cancel
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

      {/* ⬇️ Fault Records and Refresh Button remain unchanged */}
    </div>
  );
}

export default Faults;
