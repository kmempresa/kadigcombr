import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLUGGY_API_URL = 'https://api.pluggy.ai';

// Get access token from Pluggy
async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
  const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Pluggy credentials not configured');
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error('Failed to authenticate with Pluggy');
  }

  const data = JSON.parse(responseText);
  return data.apiKey;
}

// Create connect token for Pluggy Widget
async function createConnectToken(accessToken: string, itemId?: string): Promise<any> {
  console.log('Creating connect token...', { itemId });

  const body: any = {};
  if (itemId) {
    body.itemId = itemId;
  }

  const response = await fetch(`${PLUGGY_API_URL}/connect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': accessToken,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create connect token:', error);
    throw new Error(`Failed to create connect token: ${error}`);
  }

  const data = await response.json();
  console.log('Connect token created successfully');
  return data;
}

// List all items (connected accounts) for a user
async function listItems(accessToken: string): Promise<any> {
  const response = await fetch(`${PLUGGY_API_URL}/items`, {
    method: 'GET',
    headers: {
      'X-API-KEY': accessToken,
    },
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error('Failed to list items');
  }

  const data = JSON.parse(responseText);
  console.log(`Found ${data.results?.length || 0} items`);
  return data;
}

// Get item details
async function getItem(accessToken: string, itemId: string): Promise<any> {
  console.log('Getting item details...', { itemId });

  const response = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': accessToken,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get item:', error);
    throw new Error(`Failed to get item: ${error}`);
  }

  return await response.json();
}

// Get accounts for an item
async function getAccounts(accessToken: string, itemId: string): Promise<any> {
  console.log('Getting accounts...', { itemId });

  const response = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': accessToken,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get accounts:', error);
    throw new Error(`Failed to get accounts: ${error}`);
  }

  return await response.json();
}

// Get investments for an item
async function getInvestments(accessToken: string, itemId: string): Promise<any> {
  console.log('Getting investments...', { itemId });

  const response = await fetch(`${PLUGGY_API_URL}/investments?itemId=${itemId}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': accessToken,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get investments:', error);
    throw new Error(`Failed to get investments: ${error}`);
  }

  return await response.json();
}

// Delete an item
async function deleteItem(accessToken: string, itemId: string): Promise<void> {
  console.log('Deleting item...', { itemId });

  const response = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'X-API-KEY': accessToken,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to delete item:', error);
    throw new Error(`Failed to delete item: ${error}`);
  }

  console.log('Item deleted successfully');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Backend configuration missing');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, itemId } = await req.json();

    if (action === 'list-items') {
      return new Response(JSON.stringify({ error: 'Unsupported action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (itemId) {
      const { data: ownedConnection } = await supabase
        .from('pluggy_connections')
        .select('id')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!ownedConnection) {
        return new Response(JSON.stringify({ error: 'Connection not found' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get access token for all operations
    const accessToken = await getAccessToken();

    let result;

    switch (action) {
      case 'create-connect-token':
        result = await createConnectToken(accessToken, itemId);
        break;

      case 'get-item':
        if (!itemId) throw new Error('itemId is required');
        result = await getItem(accessToken, itemId);
        break;

      case 'get-accounts':
        if (!itemId) throw new Error('itemId is required');
        result = await getAccounts(accessToken, itemId);
        break;

      case 'get-investments':
        if (!itemId) throw new Error('itemId is required');
        result = await getInvestments(accessToken, itemId);
        break;

      case 'delete-item':
        if (!itemId) throw new Error('itemId is required');
        await deleteItem(accessToken, itemId);
        result = { success: true };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Pluggy error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
