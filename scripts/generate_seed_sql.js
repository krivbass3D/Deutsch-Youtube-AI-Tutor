import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lessonsPath = path.join(__dirname, '..', 'lessons.json');
const outputPath = path.join(__dirname, '..', 'supabase_seed.sql');

try {
  const rawData = fs.readFileSync(lessonsPath, 'utf8');
  const lessons = JSON.parse(rawData);

  let sql = '-- Seed data for lessons table\n';
  sql += 'TRUNCATE TABLE public.lessons CASCADE;\n\n';

  lessons.forEach(lesson => {
    const lessonId = escapeSql(lesson.lesson_id);
    const title = escapeSql(lesson.title);
    const vocabulary = escapeSql(JSON.stringify(lesson.vocabulary));
    const exercises = escapeSql(JSON.stringify(lesson.exercises));
    const answers = escapeSql(JSON.stringify(lesson.answers || []));

    sql += `INSERT INTO public.lessons (lesson_id, title, vocabulary, exercises, answers)
VALUES ('${lessonId}', '${title}', '${vocabulary}'::jsonb, '${exercises}'::jsonb, '${answers}'::jsonb)
ON CONFLICT (lesson_id) DO UPDATE SET 
    title = EXCLUDED.title,
    vocabulary = EXCLUDED.vocabulary,
    exercises = EXCLUDED.exercises,
    answers = EXCLUDED.answers;
\n`;
  });

  fs.writeFileSync(outputPath, sql);
  console.log(`Successfully generated ${outputPath}`);

} catch (err) {
  console.error('Error generating SQL:', err);
}

function escapeSql(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}
