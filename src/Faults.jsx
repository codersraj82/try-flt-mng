import React, { useEffect, useState } from "react";
import Select from "react-select";

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

const apiUrl = "/.netlify/functions/fetchFaults"; // MATCHING FUNCTION NAME

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

        if (!faultsRes.ok || !routesRes.ok) {
          throw new Error(
            `HTTP error: ${faultsRes.status}, ${routesRes.status}`
          );
        }

        const faultsData = await faultsRes.json();
        const routesData = await routesRes.json();

        const filteredFaults = (
          Array.isArray(faultsData.data) ? faultsData.data : []
        ).filter(
          (row) =>
            row["Route name as per Transnet (from Point A to B)"] &&
            row["Fault in Date & Time"] &&
            row["Status of fault(carried forward/ restored)"]
        );

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
    if (isNaN(date.getTime())) return "Invalid Date";
    return `${date.getDate().toString().padStart(2, "0")}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date.getFullYear()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const calculateFaultDuration = (row) => {
    const status =
      row["Status of fault(carried forward/ restored)"]?.toLowerCase();
    const handover = new Date(row["Date & Time of Handover of fault"]);
    let end =
      status === "restored"
        ? new Date(row["Date & Time of fault clearance"])
        : new Date();

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
      if (!formData[key] || formData[key].trim() === "") return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

  const handleEdit = (index) => {
    setFormData({ ...faults[index] });
    setEditingIndex(index);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (rowNumber) => {
    if (!window.confirm("Are you sure to delete this fault?")) return;

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, action: "delete" }),
      });

      setFaults((prev) => prev.filter((row) => row.rowNumber !== rowNumber));
    } catch (error) {
      console.error("Delete failed", error);
    }
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
              {key === "Route name as per Transnet (from Point A to B)" ? (
                <select
                  name={key}
                  value={formData[key] || ""}
                  onChange={handleChange}
                />
              ) : (
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
              )}
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
    </div>
  );
}

export default Faults;
