import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createSupabaseServer(true); // Use service role

        // Verify requester is admin
        const { data: { user }, error: authError } = await (await createSupabaseServer()).auth.getUser();
        if (authError || !user || user.app_metadata?.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        // Map users to id:email
        const emailMap: Record<string, string> = {};
        data.users.forEach(u => {
            if (u.email) emailMap[u.id] = u.email;
        });

        return NextResponse.json({ emails: emailMap });
    } catch (err: any) {
        console.error("Error listing users:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
