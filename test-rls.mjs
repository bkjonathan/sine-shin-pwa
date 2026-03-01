import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";

for (const line of envContent.split("\n")) {
  if (line.startsWith("VITE_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].trim();
  } else if (line.startsWith("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=")) {
    supabaseKey = line.split("=")[1].trim();
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccess() {
  console.log("Checking Anon Access to Orders...");
  const { data: orders, error: readError } = await supabase
    .from("orders")
    .select("id")
    .limit(1);

  if (readError) {
    console.error("Error reading order:", readError);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log("No orders found or cannot read anon.");
    return;
  }

  const targetId = orders[0].id;
  console.log(`Found order with id: ${targetId}. Attempting update...`);

  // Try updating the order
  const { data: updateData, error: updateError } = await supabase
    .from("orders")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", targetId)
    .select();

  console.log("Update Error:", updateError);
  console.log("Update Data:", updateData);
}

checkAccess().catch(console.error);
