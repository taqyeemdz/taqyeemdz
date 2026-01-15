import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        // Use service role client to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'terms_and_conditions')
            .maybeSingle();

        if (error) {
            console.error('Error fetching terms:', error);
            return NextResponse.json({ content: null }, { status: 200 });
        }

        if (!data) {
            return NextResponse.json({ content: null }, { status: 200 });
        }

        // Parse the JSONB value
        let content = null;
        if (data.value) {
            if (typeof data.value === 'string') {
                content = data.value;
            } else {
                content = JSON.stringify(data.value, null, 2);
            }
            // Remove quotes if it's a quoted string
            content = content.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
        }

        return NextResponse.json({ content }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ content: null }, { status: 500 });
    }
}
