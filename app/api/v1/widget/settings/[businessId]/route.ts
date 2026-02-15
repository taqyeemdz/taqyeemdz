import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ businessId: string }> }
) {
    try {
        const { businessId } = await params;

        if (!businessId) {
            return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
        }

        const { data: settings, error } = await supabaseAdmin
            .from('widget_settings')
            .select('button_color, button_text, position, is_enabled, api_key')
            .eq('business_id', businessId)
            .single();

        if (error || !settings) {
            // Return default settings if not found, but is_enabled: false
            return NextResponse.json({
                button_color: '#10b981',
                button_text: 'Donnez votre avis',
                position: 'bottom-right',
                is_enabled: false
            });
        }

        const response = NextResponse.json(settings);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
