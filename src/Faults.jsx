import React, { useEffect, useState } from "react";

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
  "FRT worked": "",
};

function Faults() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [editingIndex, setEditingIndex] = useState(null);

  const apiUrl = "/.netlify/functions/fetchFaults";

  useEffect(() => {
    async function fetchFaults() {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const filtered = (data.faults || []).filter(
          (row) =>
            row["Route name as per Transnet (from Point A to B)"] &&
            row["Fault in Date & Time"] &&
            row["Status of fault(carried forward/ restored)"]
        );
        setFaults(filtered);
      } catch (error) {
        console.error("Error fetching faults:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFaults();
  }, []);

  const formatDuration = (durationString) => {
    if (!durationString) return "N/A";
    const date = new Date(durationString);

    // Get total milliseconds since midnight
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const calculateFaultDuration = (row) => {
    const status =
      row["Status of fault(carried forward/ restored)"]?.toLowerCase();
    const handover = new Date(row["Date & Time of Handover of fault"]);
    let end;

    if (status === "restored") {
      end = new Date(row["Date & Time of fault clearance"]);
    } else {
      end = new Date(); // current time
    }

    const diffMs = end - handover;
    if (isNaN(diffMs)) return "Invalid";

    const totalMinutes = Math.floor(diffMs / 1000 / 60);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    for (const key of REQUIRED_FIELDS) {
      const value = formData[key];
      if (
        !value ||
        value.trim() === "" ||
        (key === "Route name as per Transnet (from Point A to B)" &&
          value.trim() === "0")
      ) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields.");
      return;
    }

    const method = formData.rowNumber ? "PUT" : "POST";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const updated = await response.json();

      if (formData.rowNumber) {
        setFaults((prev) =>
          prev.map((row) =>
            row.rowNumber === formData.rowNumber ? updated : row
          )
        );
      } else {
        setFaults((prev) => [...prev, updated]);
      }

      setFormData(initialFormData);
      setEditingIndex(null);
    } catch (error) {
      console.error("Error submitting fault:", error);
    }
  };

  const handleDelete = async (rowNumber) => {
    if (!window.confirm("Are you sure to delete this fault?")) return;

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rowNumber,
          action: "delete",
        }),
      });

      setFaults((prev) => prev.filter((row) => row.rowNumber !== rowNumber));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleEdit = (index) => {
    setFormData({ ...faults[index] });
    setEditingIndex(index);
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ marginTop: "40px", padding: "0 20px" }}>
      <h2>{formData.rowNumber ? "Edit Fault" : "Add Fault"}</h2>
      <div
        style={{
          backgroundColor: "#222",
          padding: "15px",
          borderRadius: "10px",
          color: "white",
          marginBottom: "20px",
        }}
      >
        {Object.keys(initialFormData)
          .filter((key) => key !== "rowNumber")
          .map((key) => (
            <div key={key} style={{ marginBottom: "10px" }}>
              <label>
                <strong>{key}</strong>
              </label>
              <br />
              <input
                type="text"
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
            </div>
          ))}
        <button onClick={handleSubmit} style={{ marginTop: "10px" }}>
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
          let headerColor = "#7f8c8d"; // default gray

          if (status === "restored") headerColor = "#2ecc71"; // green
          else if (status === "carried forward") headerColor = "#e74c3c"; // red

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
              {/* Card Header */}
              <div
                style={{
                  backgroundColor: headerColor,
                  padding: "10px",
                }}
              >
                <strong>
                  {row["Route name as per Transnet (from Point A to B)"] ||
                    "Unnamed Route"}
                </strong>
              </div>

              {/* Card Content */}
              <div style={{ padding: "10px" }}>
                <p>
                  <strong>Date & Time of Handover of fault:</strong>{" "}
                  {formatDate(row["Date & Time of Handover of fault"]) || "N/A"}
                </p>
                <p>
                  <strong>Fault Duration (HH:MM):</strong>{" "}
                  {calculateFaultDuration(row)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {row["Status of fault(carried forward/ restored)"] || "N/A"}
                </p>
                <p>
                  <strong>FRT worked:</strong> {row["FRT worked"] || "N/A"}
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
    </div>
  );
}

export default Faults;
