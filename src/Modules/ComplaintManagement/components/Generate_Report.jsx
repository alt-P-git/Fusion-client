import React, { useEffect, useState } from "react";
import {
  Paper,
  Badge,
  Button,
  Grid,
  Flex,
  Text,
  Select,
  Input,
} from "@mantine/core";
import { useSelector } from "react-redux";
import "../styles/GenerateReport.css";
import detailIcon from "../../../assets/detail.png";
import declinedIcon from "../../../assets/declined.png";
import resolvedIcon from "../../../assets/resolved.png";

const complaintTypes = [
  "Electricity",
  "Carpenter",
  "Plumber",
  "Garbage",
  "Dustbin",
  "Internet",
  "Other",
];

const locations = [
  "Hall-1",
  "Hall-3",
  "Hall-4",
  "Nagarjun Hostel",
  "Maa Saraswati Hostel",
  "Panini Hostel",
  "LHTC",
  "CORE LAB",
  "CC1",
  "CC2",
  "Rewa Residency",
  "NR2",
];

function GenerateReport() {
  const [complaintsData, setComplaintsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    location: "",
    complaintType: "",
    status: "",
    startDate: "",
    endDate: "",
    sortBy: "",
  });
  const username = useSelector((state) => state.user.username);

  const fetchComplaintsData = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/complaint/generate-report`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      console.log("Fetched data:", data);

      if (Array.isArray(data)) {
        setComplaintsData(data);
        setFilteredData(data);
      } else {
        console.error("Fetched data is not an array:", data);
        setComplaintsData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching complaints data:", error);
      alert(
        "There was an error fetching the complaint data. Please try again later.",
      );
    }
  };

  const applyFilters = () => {
    if (
      filters.startDate &&
      filters.endDate &&
      new Date(filters.startDate) > new Date(filters.endDate)
    ) {
      alert("Start date cannot be later than end date.");
      return;
    }

    let filtered = [...complaintsData];

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(
        (complaint) =>
          complaint.location.toLowerCase() === filters.location.toLowerCase(),
      );
    }
    // Apply complaint type filter
    if (filters.complaintType) {
      filtered = filtered.filter(
        (complaint) =>
          complaint.complaint_type.toLowerCase() ===
          filters.complaintType.toLowerCase(),
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(
        (complaint) => String(complaint.status) === filters.status,
      );
    }

    // Apply date filters
    if (filters.startDate) {
      filtered = filtered.filter(
        (complaint) =>
          new Date(complaint.complaint_date) >= new Date(filters.startDate),
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (complaint) =>
          new Date(complaint.complaint_date) <= new Date(filters.endDate),
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      if (filters.sortBy === "status") {
        filtered.sort((a, b) => a.status - b.status);
      } else if (filters.sortBy === "mostRecent") {
        filtered.sort(
          (a, b) => new Date(b.complaint_date) - new Date(a.complaint_date),
        );
      } else if (filters.sortBy === "mostOlder") {
        filtered.sort(
          (a, b) => new Date(a.complaint_date) - new Date(b.complaint_date),
        );
      }
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    fetchComplaintsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, complaintsData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const statusMapping = {
    0: "Pending",
    2: "Resolved",
    3: "Declined",
  };

  const generateCSV = () => {
    const currentDateTime = new Date().toLocaleString().replace(",", "");
    const reportTitle = `Complaint Report`;
    const dateLine = `Date of Generation: ${currentDateTime}`;
    const userLine = `Generated by: ${username}`;

    const complaintType = filters.complaintType
      ? `Complaint Type: ${filters.complaintType}`
      : "";
    const location = filters.location ? `Location: ${filters.location}` : "";
    const status = filters.status
      ? `Status: ${statusMapping[filters.status]}`
      : "";
    const startDate = filters.startDate
      ? `From Date: ${filters.startDate}`
      : "";
    const endDate = filters.endDate ? `To Date: ${filters.endDate}` : "";

    const appliedFilters = [
      complaintType && [complaintType],
      location && [location],
      status && [status],
      startDate && [startDate],
      endDate && [endDate],
    ].filter(Boolean);

    const headers = ["Complaint Type", "Location", "Status", "Date", "Details"];

    const rows = filteredData.map((complaint) => [
      complaint.complaint_type,
      complaint.location,
      statusMapping[complaint.status] || "Pending",
      formatDate(complaint.complaint_date),
      complaint.details.replace(/,/g, ""), // Remove commas to prevent CSV formatting issues
    ]);

    const csvContent = [
      [reportTitle],
      [dateLine],
      [userLine],
      ...appliedFilters,
      [],
      headers,
      ...rows,
    ]
      .map((row) => row.join(","))
      .join("\n");

    return csvContent;
  };

  const downloadCSV = () => {
    const csvData = generateCSV();

    if (!csvData) return;

    const blob = new Blob([csvData], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Complaint Report.csv";
    link.click();
  };

  return (
    <Grid
      className="full-width-container"
      style={{ paddingInline: "49px", width: "100%" }}
    >
      <Grid.Col span={8}>
        <Paper
          radius="md"
          px="lg"
          pt="sm"
          pb="xl"
          mt="xl"
          style={{
            borderLeft: "0.6rem solid #15ABFF",
            minHeight: "45vh",
            maxHeight: "70vh",
            overflowY: "hidden",
            marginTop: "-2px",
          }}
          withBorder
          maw="1240px"
          backgroundColor="white"
        >
          <Flex direction="column">
            {filteredData.length > 0 ? (
              filteredData.map((complaint, index) => {
                const displayedStatus =
                  complaint.status in statusMapping ? complaint.status : 0;

                return (
                  <Paper
                    key={index}
                    radius="md"
                    px="lg"
                    pt="sm"
                    pb="xl"
                    className="complaint-subcard"
                    withBorder
                    style={{
                      border: "2px solid black", // Add black border to each complaint card
                    }}
                  >
                    <Grid>
                      <Grid.Col span={12}>
                        <Flex justify="space-between" align="center">
                          <Text
                            style={{
                              fontWeight: "bold",
                              color: "black", // Styled to match black color like "Date" and "Location"
                            }}
                          >
                            Complaint Id: {complaint.id}
                          </Text>
                          <Badge id="complaint-type-badge">
                            {complaint.complaint_type}
                          </Badge>
                          <Flex>
                            <img
                              src={
                                statusMapping[displayedStatus] === "Resolved"
                                  ? resolvedIcon
                                  : statusMapping[displayedStatus] ===
                                      "Declined"
                                    ? declinedIcon
                                    : detailIcon
                              }
                              alt={statusMapping[displayedStatus]}
                              className="status-icon"
                            />
                          </Flex>
                        </Flex>
                      </Grid.Col>

                      <Grid.Col span={12}>
                        <Text>
                          <b>Date:</b> {formatDate(complaint.complaint_date)}
                        </Text>
                      </Grid.Col>

                      <Grid.Col span={12}>
                        <Text>
                          <b>Location:</b> {complaint.location}
                        </Text>
                      </Grid.Col>

                      <Grid.Col span={12}>
                        <Text>
                          <b>Details:</b> {complaint.details}
                        </Text>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                );
              })
            ) : (
              <Paper className="main-card-container">
                <Text align="center" color="gray">
                  No complaints found.
                </Text>
              </Paper>
            )}
          </Flex>
        </Paper>
      </Grid.Col>

      <Grid.Col span={4}>
        <Paper
          radius="md"
          px="lg"
          pt="sm"
          pb="xl"
          mt="xl"
          withBorder
          backgroundColor="white"
        >
          <Text style={{ fontWeight: "bold" }} align="center" color="black">
            Filter Complaints
          </Text>

          <Select
            label="Complaint Type"
            placeholder="Select a complaint type"
            value={filters.complaintType}
            onChange={(value) =>
              setFilters((prevFilters) => ({
                ...prevFilters,
                complaintType: value,
              }))
            }
            data={complaintTypes}
            mb="sm"
          />

          <Select
            label="Location"
            placeholder="Select a location"
            value={filters.location}
            onChange={(value) =>
              setFilters((prevFilters) => ({
                ...prevFilters,
                location: value,
              }))
            }
            data={locations}
            mb="sm"
          />

          <Select
            label="Status"
            value={filters.status}
            onChange={(value) =>
              setFilters((prevFilters) => ({
                ...prevFilters,
                status: value,
              }))
            }
            data={[
              { value: "", label: "All" },
              { value: "0", label: "Pending" },
              { value: "2", label: "Resolved" },
              { value: "3", label: "Declined" },
            ]}
            mb="sm"
          />

          {/* Start Date Input */}
          <Input.Wrapper label="Start Date" mb="sm">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((prevFilters) => ({
                  ...prevFilters,
                  startDate: event.target.value,
                }))
              }
            />
          </Input.Wrapper>

          {/* End Date Input */}
          <Input.Wrapper label="End Date" mb="sm">
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((prevFilters) => ({
                  ...prevFilters,
                  endDate: event.target.value,
                }))
              }
            />
          </Input.Wrapper>

          <Select
            label="Sort By"
            value={filters.sortBy}
            onChange={(value) =>
              setFilters((prevFilters) => ({
                ...prevFilters,
                sortBy: value,
              }))
            }
            data={[
              { value: "", label: "None" },
              { value: "status", label: "Status" },
              { value: "mostRecent", label: "Most Recent" },
              { value: "mostOlder", label: "Most Older" },
            ]}
            mb="sm"
          />

          <Button fullWidth variant="outline" onClick={downloadCSV} mt="lg">
            Download Report
          </Button>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

export default GenerateReport;
