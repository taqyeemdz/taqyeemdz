import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { business_id, api_key, rating, message, client_name, client_phone, is_anonymous, sex, age, service } = body;

        if (!business_id || !api_key) {
            return NextResponse.json({ error: 'Missing business_id or api_key' }, { status: 400 });
        }

        // Validate API Key and Business
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('widget_settings')
            .select('is_enabled, api_key')
            .eq('business_id', business_id)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json({ error: 'Widget settings not found for this business' }, { status: 404 });
        }

        if (settings.api_key !== api_key) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        if (!settings.is_enabled) {
            return NextResponse.json({ error: 'Widget integration is currently disabled' }, { status: 403 });
        }

        // Insert feedback
        const { error: insertError } = await supabaseAdmin
            .from('feedback')
            .insert({
                business_id,
                rating,
                message,
                client_name: is_anonymous ? null : client_name,
                client_phone: is_anonymous ? null : client_phone,
                is_anonymous: is_anonymous ?? true,
                sex,
                age,
                service,
                source: 'widget'
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
        }

        // Set CORS headers for the response
        const response = NextResponse.json({ success: true });
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
            'Access-Control-Max-Age': '86400',
        },
    });
}
