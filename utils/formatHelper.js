const js2xmlparser = require("js2xmlparser");

function formatResponse(data, format = "json", rootName = "data") {
    if (format === "xml") {
        return js2xmlparser.parse(rootName, data);
    }
    return JSON.stringify(data, null, 2); // Pretty-printed JSON
}

module.exports = formatResponse;
