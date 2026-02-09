import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const supabase = await createSupabaseServer(true); // service role

        // Verify requester is admin
        const { data: { user }, error: authError } = await (await createSupabaseServer()).auth.getUser();
        if (authError || !user || user.app_metadata?.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete from auth.users (this will cascade to profiles if trigger exists, 
        // but we'll also delete businesses etc if needed)

        // 1. Delete user from auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        // Note: In our current setup, profiles, businesses, etc should ideally have ON DELETE CASCADE.
        // If not, we might need manual cleanup of businesses associated with this owner.

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Error deleting user:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
