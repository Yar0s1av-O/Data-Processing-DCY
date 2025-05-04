const js2xmlparser = require("js2xmlparser");

function formatResponse(req, res, data, status = 200) {
  const acceptHeader = req.headers.accept;
  const urlFormat = req.query.format;

  if ((urlFormat && urlFormat.toLowerCase() === 'xml') ||
      (acceptHeader && acceptHeader.includes("application/xml"))) {
    res.status(status).set("Content-Type", "application/xml").send(js2xmlparser.parse("response", data));
  } else {
    res.status(status).set("Content-Type", "application/json").json(data);
  }
}

module.exports = { formatResponse };
