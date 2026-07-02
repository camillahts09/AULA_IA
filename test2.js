const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lclgnidbvzhnzrdekelz.supabase.co';
const supabaseKey = 'SEU_ANON_KEY_AQUI';
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }});

async function test() {
  try {
    const payload = { Nome: 'Teste Node 2', Nascimento: '2000-04-25', Pai: null, Mae: null, Email: 'teste2@node.com' };
    const { data, error } = await supabase.from('Pessoas').insert([payload]).select();
    console.log('DATA:', JSON.stringify(data));
    console.log('ERROR:', JSON.stringify(error));
  } catch(e) {
    console.error('EXCEPTION:', e);
  }
}
test();
