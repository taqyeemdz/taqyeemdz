import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { business_name, owner_email, category } = await req.json();

        if (!business_name || !owner_email || !category) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const supabaseAdmin = await createSupabaseServer(true);

        // 1. Generate temp password
        const tempPassword = Math.random().toString(36).slice(-10);

        // 2. Create User
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: owner_email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: business_name + " Owner" }, // Default name
            app_metadata: { role: "owner" },
        });

        if (userError) throw userError;

        const userId = userData.user.id;

        // 3. Create Business
        const { data: business, error: businessError } = await supabaseAdmin
            .from("businesses")
            .insert([
                {
                    name: business_name,
                    category: category,
                    owner_id: userId,
                },
            ])
            .select()
            .single();

        if (businessError) throw businessError;

        // 4. Link Business to User
        const { error: linkError } = await supabaseAdmin
            .from("user_business")
            .insert([{ user_id: userId, business_id: business.id }]);

        if (linkError) throw linkError;

        return NextResponse.json({
            success: true,
            temp_password: tempPassword,
            business_id: business.id
        });

    } catch (err: any) {
        console.error("Error in create-business-and-owner:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
