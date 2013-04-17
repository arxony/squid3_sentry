var STATUS_CODES = require('http').STATUS_CODES;
var HTTPParser = process.binding('http_parser').HTTPParser;

function parse(faux_http, type) {
    if(type == 'response') type = HTTPParser.RESPONSE;
    else type = HTTPParser.REQUEST;

    var parser = new HTTPParser(type);
    var faux_response;

    faux_http = Buffer.isBuffer(faux_http) ? faux_http : new Buffer(faux_http);
    
    parser.onHeadersComplete = function(data) {
         faux_response = data;
         faux_response.headers = processHeaders(data.headers);
    };

    parser.onBody = function(buffer, head_len, body_len) {
        faux_response.body = buffer.slice(head_len);
    };

    parser.execute(faux_http, 0, faux_http.length);
    var parser_error = parser.finish();
    parser = null;

    if(parser_error) {
        return parser_error;
    }
    else if(faux_response === undefined) {
        var err = new Error("Parse Error");
        err.code = 'INVALID_HTTP_INPUT';
        err.bytesParsed = 0;

        return err;
    }
    else {
        return faux_response;
    }
}

function processHeaders(header_array) {
    var header_collection = {};
    for(var i = 0, length = header_array.length; i < length; i+=2) {
        header_collection[header_array[i].toLowerCase()] = header_array[i+1];
    }
    return header_collection;
}

exports.parse = parse;
exports.chop = exports.parse;