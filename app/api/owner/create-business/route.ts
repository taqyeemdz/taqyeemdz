import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });

    // 1) Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return res.status(401).json({ error: "Not logged in" });

    const userId = session.user.id;

    // 2) Parse body
    const { name, category, phone, address } = JSON.parse(req.body);

    if (!name || !category) return res.status(400).json({ error: "Missing required fields" });

    // 3) Insert business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert([{ name, category, phone, address }])
      .select()
      .single();

    if (businessError) throw businessError;

    // 4) Link business to owner
    const { error: linkError } = await supabase
      .from("user_business")
      .insert([{ user_id: userId, business_id: business.id }]);

    if (linkError) throw linkError;

    // 5) Respond with business ID (the frontend will generate the QR)
    return res.status(200).json({ business_id: business.id });
  } catch (err: any) {
    console.error("Create business error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
