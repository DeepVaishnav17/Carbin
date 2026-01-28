const Event = require("../models/Event");
const QRCode = require("qrcode");
const sendEmail = require("../utils/sendEmail"); // your mail util
const User = require("../models/User");




const autoArchiveEvents = async () => {
  const today = new Date();

  await Event.updateMany(
    {
      date: { $lt: today },
      isArchived: false,
    },
    { $set: { isArchived: true } }
  );
};


exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      location,
      organizer: req.user.id,
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// just returns info, does NOT mark attendance
exports.scanQR = async (req, res) => {
  const { eventId, userId } = req.query;

  const user = await User.findById(userId);
  const event = await Event.findById(eventId);

  res.json({
    userName: user.name,
    eventTitle: event.title,
    userId,
    eventId,
  });
};


exports.getAllEvents = async (req, res) => {


  try {
    await autoArchiveEvents();
    const events = await Event.find({ isArchived: false })
      .populate("organizer", "name email")
      .lean();

    const formatted = events.map((e) => ({
      ...e,
      participantsCount: e.participants.length,
      attendedCount: e.attendedUsers.length,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.joinEvent = async (req, res) => {
//   try {
//     const eventId = req.params.id;
//     const userId = req.user.id;

//     const event = await Event.findById(eventId);

//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     if (event.organizer.toString() === userId) {
//       return res.status(400).json({ message: "Organizer cannot join own event" });
//     }

//     if (event.participants.some(id => id.toString() === userId)) {
//       return res.status(400).json({ message: "Already joined this event" });
//     }

//     event.participants.push(userId);
//     await event.save();

//     // -------- QR GENERATION --------
//     const qrImageUrl = `${BASE_URL}/api/events/attendance/${eventId}?userId=${userId}`;

//     //const qrImage = await QRCode.toDataURL(qrUrl);

//     // -------- EMAIL SEND --------
//     const user = await User.findById(userId);
//     console.log("QR about to send to:", user.email);

// //     await sendEmail(
// //   user.email,
// //   `QR Code for ${event.title}`,
// //   `
// //     <h2>You successfully joined "${event.title}"</h2>
// //     <p>Show this QR code to the organizer at the event:</p>
// //     <img src="cid:qrimage" />
// //   `,
// //   [
// //     {
// //       filename: "qr.png",
// //       content: qrImage.split("base64,")[1],
// //       encoding: "base64",
// //       cid: "qrimage",
// //     },
// //   ]
// //);
// await sendEmail(
//   user.email,
//   `QR Code for ${event.title}`,
//   `
//     <h2>You successfully joined "${event.title}"</h2>
//     <p>Show this QR code to the organizer at the event:</p>
//     <img src="${qrImageUrl}" />
//     <p>Location: ${event.location}</p>
//     <p>Date: ${new Date(event.date).toDateString()}</p>
//   `
// );


//     console.log("Email sent successfully");

//     res.json({ message: "Joined event. QR sent to your email!" });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
exports.joinEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer.toString() === userId) {
      return res.status(400).json({ message: "Organizer cannot join own event" });
    }

    if (event.participants.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: "Already joined this event" });
    }

    event.participants.push(userId);
    await event.save();

    const user = await User.findById(userId);

    // ✅ QR URL hosted by your backend
    const qrImageUrl = `${process.env.BACKEND_URL}/api/events/qr/${eventId}/${userId}`;

    await sendEmail(
      user.email,
      `QR Code for ${event.title}`,
      `
    <h2>You successfully joined "${event.title}"</h2>
    <p>Show this QR code to the organizer:</p>
    <img src="${qrImageUrl}" style="width:250px;height:250px;" />
    <p><b>Location:</b> ${event.location}</p>
    <p><b>Date:</b> ${new Date(event.date).toDateString()}</p>
  `
    );


    res.json({ message: "Joined event. QR sent to your email!" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};




exports.getEventParticipants = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId)
      .populate("participants", "name email")
      .populate("attendedUsers", "_id")
      .populate("organizer", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({
      participants: event.participants,
      attendedUsers: event.attendedUsers.map(u => u._id.toString())
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.markAttendance = async (req, res) => {
//   try {
//     const eventId = req.params.id;

//     // userId can come from QR (query) OR manual body
//     const userId = req.query.userId || req.body.userId;

//     const event = await Event.findById(eventId);

//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     // If coming from QR, skip organizer check (QR is organizer action)
//     if (!req.query.userId) {
//       if (event.organizer.toString() !== req.user.id) {
//         return res.status(403).json({ message: "Not authorized" });
//       }
//     }

//     if (!event.participants.some(id => id.toString() === userId)){
//       return res.status(400).json({ message: "User did not join event" });
//     }

//     if (event.attendedUsers.some(id => id.toString() === userId)){
//       return res.status(400).json({ message: "Already marked attended" });
//     }

//     event.attendedUsers.push(userId);
//     await event.save();

//     res.send("Attendance marked via QR ✅");
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
exports.markAttendance = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.body?.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId required in body" });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🔥 ALWAYS CHECK ORGANIZER
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only organizer can mark attendance" });
    }

    if (!event.participants.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: "User did not join event" });
    }

    if (event.attendedUsers.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: "Already marked attended" });
    }

    event.attendedUsers.push(userId);
    await event.save();

    res.json({ message: "Attendance marked ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      organizer: req.user.id,
      isArchived: false,
    }).populate("organizer", "name email");

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.generateQR = async (req, res) => {
  try {
    console.log("QR URL:", process.env.FRONTEND_URL);

    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // user must be participant
    if (!event.participants.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: "Join event first" });
    }

    const qrUrl = `${process.env.FRONTEND_URL}/scan?eventId=${eventId}&userId=${userId}`;

    const qrImage = await QRCode.toDataURL(qrUrl);

    res.json({ qrImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.archiveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    event.isArchived = true;
    await event.save();

    res.json({ message: "Event archived" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPastEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({
      isArchived: true,
      $or: [
        { organizer: userId },
        { participants: userId },
      ],
    })
      .populate("organizer", "name email")
      .lean();

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllEventsForAdmin = async (req, res) => {
  try {
    const events = await Event.find({})
      .populate("organizer", "name email")
      .populate("participants", "name email")
      .populate("attendedUsers", "name email");

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.generateQRImage = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const qrUrl = `${process.env.FRONTEND_URL}/scan?eventId=${eventId}&userId=${userId}`;

    const qrImage = await QRCode.toBuffer(qrUrl);

    res.setHeader("Content-Type", "image/png");
    res.send(qrImage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
