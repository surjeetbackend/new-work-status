const express = require("express");
const router = express.Router();
const { Parser } = require("json2csv");
const Work = require("../models/Work");

router.get("/download/csv", async (req, res) => {
  try {
    const works = await Work.find().populate("history.supervisor", "name");
       

   
    const flatData = [];

    works.forEach((work) => {
      if (work.history.length === 0) {
       
        flatData.push({
          token_no: work.token_no,
          work_type: work.work_type,
          status: work.status,
          location: work.location,
          approvalStatus: work.approvalStatus,
          activity: "No activity"
        });
      } else {
        work.history.forEach((entry) => {
          flatData.push({
            token_no: work.token_no,
            work_type: work.work_type,
            status: work.status,
            location: work.location,
            approvalStatus: work.approvalStatus,
            supervisor: entry.supervisor?.name || entry.supervisor?.toString() || "N/A",
            assignedOn: entry.assignedOn ? new Date(entry.assignedOn).toLocaleString() : "",
            unassignedOn: entry.unassignedOn ? new Date(entry.unassignedOn).toLocaleString() : "",
            
          });
        });
      }
    });

    const fields = [
      "token_no",
      "work_type",
      "status",
      "location",
      "approvalStatus",
      "supervisor",
      "assignedOn",
      "unassignedOn"
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flatData);

    res.header("Content-Type", "text/csv");
    res.attachment("work_activity_report.csv");
    return res.send(csv);
  } catch (error) {
    console.error("CSV Error:", error);
    res.status(500).json({ error: "Failed to generate activity CSV" });
  }
});

router.get("/admin/material-report-csv", async (req, res) => {
  try {
    const works = await Work.find({ "materialRequests.0": { $exists: true } })
      .populate("materialRequests.supervisor", "name email");

    const data = [];

    works.forEach((work) => {
      // Sort materialRequests by requestedOn DESC
      const sortedRequests = [...work.materialRequests].sort((a, b) => {
        return new Date(b.requestedOn) - new Date(a.requestedOn);
      });

      sortedRequests.forEach((req) => {
        data.push({
          token_no: work.token_no,
          work_type: work.work_type,
          location: work.location,
          supervisor: req.supervisor?.name || "N/A",
          item: req.item,
          quantity: req.quantity,
          requiredDate: req.requiredDate?.toISOString().split("T")[0] || "",
          requestedOn: req.requestedOn?.toISOString().split("T")[0] || "",
          status: req.status,
          remarks: req.remarks || "",
        });
      });
    });

    const fields = [
      "token_no",
      "work_type",
      "location",
      "supervisor",
      "item",
      "quantity",
      "requiredDate",
      "requestedOn",
      "status",
      "remarks",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("material-report.csv");
    return res.send(csv);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(500).json({ error: "Failed to generate CSV report" });
  }
});

module.exports = router;
