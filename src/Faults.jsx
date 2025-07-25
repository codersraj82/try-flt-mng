import React, { useEffect, useState } from "react";

const apiUrl = "/.netlify/functions/fetchFault"; // Make sure this matches your Netlify function route

const Faults = () => {
  const [faults, setFaults] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [editingRowIndex, setEditingRowIndex] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (index) => {
    setEditingRowIndex(index);
    setFormData(faults[index]);
  };

  const handleCancel = () => {
    setEditingRowIndex(null);
    setFormData({});
  };

  const handleSave = () => {
    // TODO: Add logic to submit the edited data (POST/PUT request to backend or Google Sheet)
    const updatedFaults = [...faults];
    updatedFaults[editingRowIndex] = formData;
    setFaults(updatedFaults);
    setEditingRowIndex(null);
    setFormData({});
  };

  if (loading) {
    return <p>Loading faults and route list...</p>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Fault Reports</h2>
      {faults.map((fault, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#f9f9f9",
          }}
        >
          {editingRowIndex === index ? (
            <form onSubmit={(e) => e.preventDefault()}>
              {Object.keys(fault).map((key) => (
                <div key={key} style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontWeight: "bold" }}>{key}</label>
                  {key === "Route name as per Transnet (from Point A to B)" ? (
                    <select
                      name={key}
                      value={formData[key] || ""}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #888",
                      }}
                    >
                      <option value="">-- Select Route --</option>
                      {routes.map((route, idx) => (
                        <option key={idx} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
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
              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{ marginRight: "10px" }}
                >
                  Save
                </button>
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {Object.entries(fault).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {value}
                </p>
              ))}
              <button onClick={() => handleEdit(index)}>Edit</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default Faults;
