import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sanitizeText } from '@/lib/security';

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ setupRequired: true, message: 'OPENAI_API_KEY belum diisi. AgronityAI tidak memberi respons palsu.' }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { chatId, message, allowContext } = await req.json();
  const text = sanitizeText(String(message || '')).slice(0, 4000);
  if (!text) return NextResponse.json({ error: 'Pesan kosong.' }, { status: 400 });
  const admin = createSupabaseAdminClient();
  let context = '';
  if (allowContext) {
    const [jadwal, grades, journals, finance] = await Promise.all([
      admin.from('jadwal_perkuliahan').select('hari,waktu,nama_matkul,ruangan').limit(20),
      admin.from('khs_courses').select('semester,course_name,sks,grade_letter,grade_point').eq('user_id', user.id).limit(80),
      admin.from('journals').select('entry_date,mood,tags,title,body').eq('user_id', user.id).order('entry_date',{ascending:false}).limit(10),
      admin.from('finance_transactions').select('type,amount,category,transaction_date,note').eq('user_id', user.id).order('transaction_date',{ascending:false}).limit(30)
    ]);
    context = JSON.stringify({ jadwal: jadwal.data, grades: grades.data, journals: journals.data, finance: finance.data }).slice(0, 12000);
  }
  let realChatId = chatId;
  if (!realChatId) {
    const { data, error } = await admin.from('ai_chats').insert({ user_id: user.id, title: text.slice(0, 60) }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    realChatId = data.id;
  }
  await admin.from('ai_messages').insert({ chat_id: realChatId, user_id: user.id, role: 'user', content: text });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [
      { role: 'system', content: 'Kamu adalah AgronityAI, asisten resmi mahasiswa TIP ULM 2025. Jawab ringkas, praktis, berbahasa Indonesia, dan jangan mengarang data pribadi. Jika data konteks tidak tersedia, katakan perlu data.' },
      { role: 'user', content: `Konteks yang diizinkan user: ${context || 'tidak ada'}\n\nPertanyaan: ${text}` }
    ]
  });
  const answer = response.output_text || 'Tidak ada respons dari model.';
  await admin.from('ai_messages').insert({ chat_id: realChatId, user_id: user.id, role: 'assistant', content: answer });
  await admin.rpc('record_activity_for_user', { p_user_id: user.id, p_activity_type: 'ai_chat', p_metadata: { chat_id: realChatId } });
  return NextResponse.json({ chatId: realChatId, answer });
}
