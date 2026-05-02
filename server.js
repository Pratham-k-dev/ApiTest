import express from "express";
import db from "./db.js";

const app = express();
app.use(express.json());


/* ---------------- ADD SCHOOL ---------------- */
app.post("/addSchool", async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude must be numbers"
      });
    }

    await db.query(
      "INSERT INTO schools (name, address, latitude, longitude) VALUES ($1, $2, $3, $4)",
      [name, address, latitude, longitude]
    );

    res.json({
      success: true,
      message: "School added successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* ---------------- LIST SCHOOLS ---------------- */
app.get("/listSchools", async (req, res) => {
  try {
    const userLat = parseFloat(req.query.latitude);
    const userLng = parseFloat(req.query.longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude required"
      });
    }

    const result = await db.query("SELECT * FROM schools");
    const schools = result.rows;

    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const toRad = (val) => (val * Math.PI) / 180;

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const sorted = schools
      .map((school) => ({
        ...school,
        distance: getDistance(
          userLat,
          userLng,
          school.latitude,
          school.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: sorted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});