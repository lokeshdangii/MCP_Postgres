#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema

} from "@modelcontextprotocol/sdk/types.js";

const pg = require("pg");
const server = new Server(
  {
    name: "example-server/postgres",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts:{}
    },
  },
);

// const args = process.argv.slice(2);
// if (args.length === 0) {
//   console.error("Please provide a database URL as a command-line argument");
//   process.exit(1);
// }

const db_config = {
  host: "localhost",
  user: "postgres",
  password: "root",
  dbname: "cardb",
};

const databaseUrl = `postgresql://${db_config.user}:${db_config.password}@${db_config.host}/${db_config.dbname}`;
const postgresUrl = new URL(databaseUrl);
const resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "postgres:";
resourceBaseUrl.password = "";

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

const SCHEMA_PATH = "schema";

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    return {
      resources: result.rows.map((row) => ({
        uri: new URL(`${row.table_name}/${SCHEMA_PATH}`, resourceBaseUrl).href,
        mimeType: "application/json",
        name: `"${row.table_name}" database schema`,
      })),
    };
  } finally {
    client.release();
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resourceUrl = new URL(request.params.uri);

  const pathComponents = resourceUrl.pathname.split("/");
  const schema = pathComponents.pop();
  const tableName = pathComponents.pop();

  if (schema !== SCHEMA_PATH) {
    throw new Error("Invalid resource URI");
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
      [tableName],
    );

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(result.rows, null, 2),
        },
      ],
    };
  } finally {
    client.release();
  }
});

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [{
      name: "system-prompt",
      description: `this is the baundary line for chat app to function properly`,
      arguments: [{
        name: "arg1",
        description: "",
        type: "string"
      }]
    }]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  
  if (request.params.name !== "system-prompt") {
    throw new Error("Unknown prompt");
  }
  return {
    description: "prompts for chat app to function properly",
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `I am attaching the database schema with the prompt and you have access of mcp server and you can run any types of postgres sql queries , so generate the sql queries for the user prompt and optimise it ;
        The database is about car and its color, engine, variants, models, and category. It also contains customer, finance, installment, payment, sale, salesperson details.
        I have attached the database named cardb.
        Here is the schema of the database:
        
psql (16.8 (Ubuntu 16.8-0ubuntu0.24.04.1), server 14.13 (Ubuntu 14.13-0ubuntu0.22.04.1))
You are now connected to database "cardb" as user "postgres".
cardb=# \dt
            List of relations
 Schema |    Name     | Type  |  Owner   
--------+-------------+-------+----------
 public | car         | table | postgres
 public | carcategory | table | postgres
 public | carcolor    | table | postgres
 public | carengine   | table | postgres
 public | carmodel    | table | postgres
 public | carvariant  | table | postgres
 public | customer    | table | postgres
 public | finance     | table | postgres
 public | installment | table | postgres
 public | payment     | table | postgres
 public | sale        | table | postgres
 public | salesperson | table | postgres
(12 rows)

cardb=# \l car
                                            List of databases
 Name | Owner | Encoding | Locale Provider | Collate | Ctype | ICU Locale | ICU Rules | Access privileges 
------+-------+----------+-----------------+---------+-------+------------+-----------+-------------------
(0 rows)

cardb=# \d car
                                           Table "public.car"
      Column       |          Type          | Collation | Nullable |              Default               
-------------------+------------------------+-----------+----------+------------------------------------
 carid             | integer                |           | not null | nextval('car_carid_seq'::regclass)
 variantid         | integer                |           |          | 
 categoryid        | integer                |           |          | 
 engineid          | integer                |           |          | 
 colorid           | integer                |           |          | 
 modelid           | integer                |           |          | 
 vin               | character varying(17)  |           |          | 
 mileage           | integer                |           |          | 
 yearofmanufacture | integer                |           |          | 
 brandcompany      | character varying(100) |           |          | 
Indexes:
    "car_pkey" PRIMARY KEY, btree (carid)
    "car_vin_key" UNIQUE CONSTRAINT, btree (vin)
Foreign-key constraints:
    "car_categoryid_fkey" FOREIGN KEY (categoryid) REFERENCES carcategory(categoryid) ON UPDATE CASCADE ON DELETE CASCADE
    "car_colorid_fkey" FOREIGN KEY (colorid) REFERENCES carcolor(colorid) ON UPDATE CASCADE ON DELETE CASCADE
    "car_engineid_fkey" FOREIGN KEY (engineid) REFERENCES carengine(engineid) ON UPDATE CASCADE ON DELETE CASCADE
    "car_modelid_fkey" FOREIGN KEY (modelid) REFERENCES carmodel(modelid) ON UPDATE CASCADE ON DELETE CASCADE
    "car_variantid_fkey" FOREIGN KEY (variantid) REFERENCES carvariant(variantid) ON UPDATE CASCADE ON DELETE CASCADE
Referenced by:
    TABLE "sale" CONSTRAINT "sale_carid_fkey" FOREIGN KEY (carid) REFERENCES car(carid) ON UPDATE CASCADE ON DELETE CASCADE

cardb=# \d carcolor
                                       Table "public.carcolor"
  Column   |         Type          | Collation | Nullable |                  Default                  
-----------+-----------------------+-----------+----------+-------------------------------------------
 colorid   | integer               |           | not null | nextval('carcolor_colorid_seq'::regclass)
 colorname | character varying(50) |           |          | 
Indexes:
    "carcolor_pkey" PRIMARY KEY, btree (colorid)
Referenced by:
    TABLE "car" CONSTRAINT "car_colorid_fkey" FOREIGN KEY (colorid) REFERENCES carcolor(colorid) ON UPDATE CASCADE ON DELETE CASCADE
    TABLE "carvariant" CONSTRAINT "carvariant_colorid_fkey" FOREIGN KEY (colorid) REFERENCES carcolor(colorid) ON UPDATE CASCADE ON DELETE CASCADE

cardb=# \carengine
invalid command \carengine
Try \? for help.
cardb=# \d carengine
                                         Table "public.carengine"
   Column   |          Type          | Collation | Nullable |                   Default                   
------------+------------------------+-----------+----------+---------------------------------------------
 engineid   | integer                |           | not null | nextval('carengine_engineid_seq'::regclass)
 enginename | character varying(100) |           |          | 
Indexes:
    "carengine_pkey" PRIMARY KEY, btree (engineid)
Referenced by:
    TABLE "car" CONSTRAINT "car_engineid_fkey" FOREIGN KEY (engineid) REFERENCES carengine(engineid) ON UPDATE CASCADE ON DELETE CASCADE
    TABLE "carmodel" CONSTRAINT "carmodel_engineid_fkey" FOREIGN KEY (engineid) REFERENCES carengine(engineid) ON UPDATE CASCADE ON DELETE CASCADE

cardb=# \d carvariant
                                          Table "public.carvariant"
   Column    |          Type          | Collation | Nullable |                    Default                    
-------------+------------------------+-----------+----------+-----------------------------------------------
 variantid   | integer                |           | not null | nextval('carvariant_variantid_seq'::regclass)
 modelid     | integer                |           |          | 
 colorid     | integer                |           |          | 
 categoryid  | integer                |           |          | 
 variantname | character varying(100) |           |          | 
 mileage     | double precision       |           |          | 
 enginetype  | character varying(50)  |           |          | 
 price       | numeric(10,2)          |           |          | 
Indexes:
    "carvariant_pkey" PRIMARY KEY, btree (variantid)
Foreign-key constraints:
    "carvariant_categoryid_fkey" FOREIGN KEY (categoryid) REFERENCES carcategory(categoryid) ON UPDATE CASCADE ON DELETE CASCADE
    "carvariant_colorid_fkey" FOREIGN KEY (colorid) REFERENCES carcolor(colorid) ON UPDATE CASCADE ON DELETE CASCADE
    "carvariant_modelid_fkey" FOREIGN KEY (modelid) REFERENCES carmodel(modelid) ON UPDATE CASCADE ON DELETE CASCADE
Referenced by:
    TABLE "car" CONSTRAINT "car_variantid_fkey" FOREIGN KEY (variantid) REFERENCES carvariant(variantid) ON UPDATE CASCADE ON DELETE CASCADE

cardb=# 

 `
      }
    }]
  };
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
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
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "query") {
    const sql = request.params.arguments?.sql as string;

    const client = await pool.connect();
    try {
      await client.query("BEGIN TRANSACTION READ ONLY");
      const result = await client.query(sql);
      return {
        content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
        isError: false,
      };
    } catch (error) {
      throw error;
    } finally {
      client
        .query("ROLLBACK")
        .catch((error) =>
          console.warn("Could not roll back transaction:", error),
        );

      client.release();
    }
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Add this to log when server is ready
  console.log('MCP server is running and ready to accept connections');
}

runServer().catch(console.error);
