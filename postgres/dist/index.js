#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var pg_1 = require("pg");
var server = new index_js_1.Server({
    name: "example-servers/postgres",
    version: "0.1.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
var args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Please provide a database URL as a command-line argument");
    process.exit(1);
}
var databaseUrl = args[0];
var resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "postgres:";
resourceBaseUrl.password = "";
var pool = new pg_1.default.Pool({
    connectionString: databaseUrl,
});
var SCHEMA_PATH = "schema";
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    var client, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, pool.connect()];
            case 1:
                client = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, , 4, 5]);
                return [4 /*yield*/, client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")];
            case 3:
                result = _a.sent();
                return [2 /*return*/, {
                        resources: result.rows.map(function (row) { return ({
                            uri: new URL("".concat(row.table_name, "/").concat(SCHEMA_PATH), resourceBaseUrl).href,
                            mimeType: "application/json",
                            name: "\"".concat(row.table_name, "\" database schema"),
                        }); }),
                    }];
            case 4:
                client.release();
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var resourceUrl, pathComponents, schema, tableName, client, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                resourceUrl = new URL(request.params.uri);
                pathComponents = resourceUrl.pathname.split("/");
                schema = pathComponents.pop();
                tableName = pathComponents.pop();
                if (schema !== SCHEMA_PATH) {
                    throw new Error("Invalid resource URI");
                }
                return [4 /*yield*/, pool.connect()];
            case 1:
                client = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, , 4, 5]);
                return [4 /*yield*/, client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [tableName])];
            case 3:
                result = _a.sent();
                return [2 /*return*/, {
                        contents: [
                            {
                                uri: request.params.uri,
                                mimeType: "application/json",
                                text: JSON.stringify(result.rows, null, 2),
                            },
                        ],
                    }];
            case 4:
                client.release();
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                tools: [
                    {
                        name: "query",
                        description: "Run a read-only SQL query",
                        inputSchema: {
                            type: "object",
                            properties: {
                                sql: { type: "string" },
                            },
                        },
                    },
                ],
            }];
    });
}); });
server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var sql, client, result, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(request.params.name === "query")) return [3 /*break*/, 7];
                sql = (_a = request.params.arguments) === null || _a === void 0 ? void 0 : _a.sql;
                return [4 /*yield*/, pool.connect()];
            case 1:
                client = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 5, 6, 7]);
                return [4 /*yield*/, client.query("BEGIN TRANSACTION READ ONLY")];
            case 3:
                _b.sent();
                return [4 /*yield*/, client.query(sql)];
            case 4:
                result = _b.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
                        isError: false,
                    }];
            case 5:
                error_1 = _b.sent();
                throw error_1;
            case 6:
                client
                    .query("ROLLBACK")
                    .catch(function (error) {
                    return console.warn("Could not roll back transaction:", error);
                });
                client.release();
                return [7 /*endfinally*/];
            case 7: throw new Error("Unknown tool: ".concat(request.params.name));
        }
    });
}); });
function runServer() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
runServer().catch(console.error);
