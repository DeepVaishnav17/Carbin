const express = require("express");
const router = express.Router();
const { createEvent, getAllEvents, joinEvent, getEventParticipants ,markAttendance,getMyEvents, generateQR , getPastEvents, getAllEventsForAdmin, scanQR } = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");
const { archiveEvent } = require("../controllers/eventController");
const { adminOnly } = require("../middleware/adminMiddleware");
const QRCode = require("qrcode");




router.post("/create", protect, createEvent);
router.get("/", getAllEvents);
router.post("/join/:id", protect, joinEvent);
router.get("/participants/:id", protect, getEventParticipants);

router.post("/attendance/:id", protect, markAttendance); // for UI button

router.get("/my-events", protect, getMyEvents);
router.get("/qr/:id", protect, generateQR);

router.post("/archive/:id", protect, archiveEvent);
router.get("/past", protect, getPastEvents);

router.get("/admin/all", protect, adminOnly, getAllEventsForAdmin);


// router.get("/qr/:eventId/:userId", async (req, res) => {
//   const { eventId, userId } = req.params;

//   const qrUrl = `${process.env.FRONTEND_URL}/scan?eventId=${eventId}&userId=${userId}`;

//   const qrBuffer = await QRCode.toBuffer(qrUrl);

//   res.setHeader("Content-Type", "image/png");
//   res.send(qrBuffer);
// });

router.get("/scan", scanQR);






module.exports = router;
