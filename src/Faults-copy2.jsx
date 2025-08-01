import React, { useEffect, useState } from "react";

const REQUIRED_FIELDS = [
  "Route name as per Transnet (from Point A to B)",
  "Fault in Date & Time",
  "Date & Time of Handover of fault",
  "Status of fault(carried forward/ restored)",
];

const initialFormData = {
  "Route name as per Transnet (from Point A to B)": "",
  "Fault in Date & Time": "",
  "Date & Time of Handover of fault": "",
  "Fault durration (Hrs)": "",
  "Nature of Fault": "",
  "Name of field staff attended the fault": "",
  "Fault restored by": "",
  "Restored Date & Time": "",
  Remarks: "",
  "Status of fault(carried forward/ restored)": "",
  rowNumber: null,
};

function Faults() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [editingIndex, setEditingIndex] = useState(null);

  const apiUrl =
    "https://script.google.com/macros/s/AKfycbyP6Wh0bGGq2IF-b9jv5qT729Ii02zA6aoEfWaXOwqplkl373dkIOGvYg_1AN1kkeD0yQ/exec";

  useEffect(() => {
    async function fetchFaults() {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const filtered = data.filter(
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    for (const key of REQUIRED_FIELDS) {
      if (!formData[key]) return false;
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
        method,
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

  const handleDelete = async (rowNumber) => {
    if (!window.confirm("Are you sure to delete this fault?")) return;

    try {
      await fetch(apiUrl, {
        method: "DELETE",
        body: JSON.stringify({ rowNumber }),
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
        faults.map((row, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              backgroundColor: "#221e1eff",
              color: "white",
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
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={() => handleEdit(index)}>Edit</button>
              <button onClick={() => handleDelete(row.rowNumber)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Faults;
