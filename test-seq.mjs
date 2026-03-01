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

async function checkSequence() {
  console.log("Checking order_items insert behavior...");

  // Try inserting a dummy item to see what ID it tries to claim
  const dummyItem = {
    order_id: null, // Just to test the sequence
    product_url: "test_seq_check",
    price: 0,
  };

  const { data, error } = await supabase
    .from("order_items")
    .insert(dummyItem)
    .select();

  console.log("Insert Output:", data);
  console.log("Insert Error:", error);
}

checkSequence().catch(console.error);
