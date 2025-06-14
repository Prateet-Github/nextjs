import { Connection } from "mongoose"; // Importing Connection type from mongoose

declare global {
  var mongoose :{
    conn : Connection | null; // Connection to the MongoDB database
    promise: Promise<Connection> | null; // Promise that resolves to the connection
  }
}

export {}