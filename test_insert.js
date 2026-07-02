const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lclgnidbvzhnzrdekelz.supabase.co';
const supabaseKey = 'SEU_ANON_KEY_AQUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const payload = { Nome: 'Teste Node', Nascimento: '2000-04-25', Pai: null, Mae: null, Email: 'teste@node.com' };
  const { data, error } = await supabase.from('Pessoas').insert([payload]).select();
  console.log('Result:', data, error);
}
test();
