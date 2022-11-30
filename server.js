const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const expressRequestId = require("express-request-id")();
const { PORT, MONGO_URL } = require("./src/utils/config");
const logger = require("./src/utils/logger");

const app = express();

app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  next();
});

app.use(expressRequestId);

morgan.token("requestId", (request) => request.id);

app.use(
  morgan(":requestId :method :url :status :response-time ms", {
    stream: {
      write: (message) => logger.http(message),
    },
  })
);

const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(express.json({ verify: rawBodySaver, limit: "10mb" }));
app.use(
  express.urlencoded({ verify: rawBodySaver, extended: true, limit: "10mb" })
);
app.use(express.raw({ verify: rawBodySaver, type: "*/*", limit: "10mb" }));

app.use(cors());

// const whitelistHosts = ["localhost:3000"];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);

//       // verify origin
//       const { host, protocol } = new URL(origin);

//       // if (!protocol.includes("https")) {
//       //   return callback(
//       //     new Error(
//       //       "The CORS policy for this site does not allow access from non https hosts."
//       //     ),
//       //     false
//       //   );
//       // }

//       const [subdomain, hostname, domain] = host.split(".");

//       let actualHost = "";

//       if (hostname.includes("localhost") && !domain) {
//         // running on local
//         actualHost = hostname;
//       } else {
//         // running on cloud
//         actualHost = `${hostname}.${domain}`;
//       }

//       if (whitelistHosts.indexOf(actualHost) === -1) {
//         return callback(
//           new Error(
//             "The CORS policy for this site does not allow access from the specified Origin."
//           ),
//           false
//         );
//       }

//       return callback(null, true);
//     },
//   })
// );

const tenantRoutes = require("./src/api/v1/tenant");
const userRoutes = require("./src/api/v1/users");
const feedbackRoutes = require("./src/api/v1/feedback");
const statsRoutes = require("./src/api/v1/stats");
const worklogRoutes = require("./src/api/v1/worklog");
const companyValuesRoutes = require("./src/api/v1/company-values");
const recognitionRoutes = require("./src/api/v1/recognition");

app.use("/v1/tenant", tenantRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/feedback", feedbackRoutes);
app.use("/v1/stats", statsRoutes);
app.use("/v1/worklog", worklogRoutes);
app.use("/v1/company-values", companyValuesRoutes);
app.use("/v1/recognition", recognitionRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

const server = app.listen(PORT, () => {
  try {
    mongoose
      .connect(MONGO_URL)
      .then(() => logger.info("MongoDB Connected!!!"))
      .catch((err) => logger.error("MongoDB Connection Failed -> error ", err));

    logger.info(`App is now running on port ${PORT}!!!`);
  } catch (error) {
    logger.error("Failed to start server -> error : ", error);
  }
});

server.keepAliveTimeout = 65000; // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
server.headersTimeout = 66000; // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363
