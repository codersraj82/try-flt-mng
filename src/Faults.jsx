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
  "Route name as per Transnet (from Point A to B)": "",
  "Fault in Date & Time": "",
  "Date & Time of Handover of fault": "",
  "Status of fault(carried forward/ restored)": "",
  Remark: "",
};

export default function Faults({ apiUrl }) {
  const [formData, setFormData] = useState(initialFormData);
  const [faults, setFaults] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [apiUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const routeOptions = routes.map((route) => ({
    value: route["Route name as per Transnet (from Point A to B)"],
    label: route["Route name as per Transnet (from Point A to B)"],
    key: route.rowNumber,
  }));

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Fault Reporting</h2>
      <form>
        {REQUIRED_FIELDS.map((key) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <label>{key}</label>
            {key === "Route name as per Transnet (from Point A to B)" ? (
              <Select
                options={routeOptions}
                onChange={(selectedOption) =>
                  handleChange({
                    target: {
                      name: key,
                      value: selectedOption?.value || "",
                    },
                  })
                }
                value={
                  routeOptions.find(
                    (option) => option.value === formData[key]
                  ) || null
                }
                isClearable
                placeholder="Search or select route..."
              />
            ) : (
              <input
                type="text"
                name={key}
                value={formData[key] || ""}
                onChange={handleChange}
              />
            )}
          </div>
        ))}
      </form>

      <h3>Reported Faults</h3>
      {faults.map((fault, index) => (
        <div
          key={fault.rowNumber || index}
          style={{
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <p>
            <strong>Route:</strong>{" "}
            {fault["Route name as per Transnet (from Point A to B)"]}
          </p>
          <p>
            <strong>Fault In:</strong> {fault["Fault in Date & Time"]}
          </p>
          <p>
            <strong>Handover:</strong>{" "}
            {fault["Date & Time of Handover of fault"]}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {fault["Status of fault(carried forward/ restored)"]}
          </p>
        </div>
      ))}
    </div>
  );
}
