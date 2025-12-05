import dotenv from 'dotenv';
import OpenAI from 'openai';
import { spawnSync, execSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type CommitMessage = {
  title: string;
  body: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  override: true,
});

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

if (!apiKey) {
  console.error(
    '[ai-commit] OPENAI_API_KEY가 설정되지 않았습니다. 루트 .env를 확인하세요.'
  );
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const getStagedDiff = (): string => {
  let diff = '';
  try {
    diff = execSync('git diff --cached', { encoding: 'utf8' });
  } catch (e) {
    console.error('[ai-commit] git diff --cached 실행에 실패했습니다.');
    process.exit(1);
  }

  if (!diff.trim()) {
    console.error(
      '[ai-commit] 스테이징된 변경이 없습니다. 먼저 `git add`로 변경을 올려주세요.'
    );
    process.exit(1);
  }

  return diff;
};

const generateCommitMessage = async (diff: string): Promise<CommitMessage> => {
  console.log('[ai-commit] AI가 커밋 제목과 상세 설명을 생성 중입니다...\n');

  const response = await client.responses.create({
    model,
    instructions: [
      '너는 Git 커밋 메시지를 작성하는 도우미야.',
      'Conventional Commits 형식을 사용해서 제목과 본문을 만들어줘.',
      '',
      '요구사항:',
      '- title: 한 줄짜리 커밋 제목.',
      "  - 예: 'feat: PWA 오프라인 캐시 기능 추가'",
      '  - 타입(feat, fix, refactor, docs, chore 등)은 영어 그대로 사용.',
      '  - 나머지 설명은 모두 한국어로 작성.',
      '- body: 커밋 상세 설명 (최대 3줄까지 가능).',
      '  - 무엇을, 왜, 어떻게 변경했는지 한국어로 간단하고 명확하게.',
      '  - 불릿 리스트(-)나 짧은 문장 최대 3줄로 요약해서 작성해도 좋음.',
      '',
      '반드시 아래 JSON 형식으로만 출력해:',
      '{',
      '  "title": "feat: ~~",',
      '  "body": "- ~~\\n- ~~"',
      '}',
      '',
      '추가 텍스트 없이 JSON만 반환해.',
    ].join('\n'),
    input: [
      {
        role: 'user',
        content:
          '다음 Git diff를 보고 한국어로 커밋 제목과 상세 설명을 만들어줘.\n\n' +
          diff,
      },
    ],
    max_output_tokens: 256,
  });

  const raw = response.output_text?.trim();
  if (!raw) {
    throw new Error('모델이 응답을 생성하지 못했습니다.');
  }

  let title = '';
  let body = '';

  try {
    const parsed = JSON.parse(raw) as { title?: string; body?: string };
    title = (parsed.title ?? '').trim();
    body = (parsed.body ?? '').trim();
  } catch (e) {
    // JSON 파싱 실패 시: 첫 줄을 제목, 나머지를 본문으로 간주
    const lines = raw.split(/\r?\n/);
    title = (lines[0] ?? '').trim();
    body = lines.slice(1).join('\n').trim();
  }

  if (!title) {
    throw new Error('커밋 제목(title)을 생성하지 못했습니다.');
  }

  return { title, body };
};

const askUserForDecision = async (
  message: CommitMessage
): Promise<CommitMessage | null> => {
  console.log('제안된 커밋 메시지:');
  console.log(`\n${message.title}\n`);
  if (message.body) {
    console.log(message.body);
    console.log('');
  }

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    '이대로 커밋할까요? (y = 예, e = 제목/본문 수정, n = 취소) '
  );

  const lower = answer.trim().toLowerCase();
  if (lower === 'n') {
    rl.close();
    console.log('[ai-commit] 커밋을 취소했습니다.');
    return null;
  }

  if (lower === 'e') {
    const newTitle = await rl.question(
      `새 제목 (Enter = 기존 유지)\n현재: ${message.title}\n> `
    );
    const newBody = await rl.question(
      '새 본문 (Enter = 기존 유지, 여러 줄은 나중에 에디터에서 직접 수정하는 걸 추천)\n> '
    );
    rl.close();

    return {
      title: newTitle.trim() || message.title,
      body: newBody.trim() || message.body,
    };
  }

  rl.close();

  return message;
};

const runGitCommit = (message: CommitMessage) => {
  const args = ['commit', '-m', message.title];

  if (message.body && message.body.trim().length > 0) {
    // git commit -m "title" -m "body"
    args.push('-m', message.body);
  }

  console.log(`\n[ai-commit] git ${args.join(' ')} 실행 중...\n`);

  const result = spawnSync('git', args, {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(
      `\n[ai-commit] git commit이 실패했습니다. (exit code: ${result.status})`
    );
    process.exit(result.status ?? 1);
  }
};

const main = async () => {
  const diff = getStagedDiff();

  let aiMessage: CommitMessage;
  try {
    aiMessage = await generateCommitMessage(diff);
  } catch (err) {
    console.error('[ai-commit] 커밋 메시지 생성 중 오류:', err);
    process.exit(1);
    return;
  }

  const finalMessage = await askUserForDecision(aiMessage);
  if (!finalMessage) {
    return;
  }

  runGitCommit(finalMessage);
};

main().catch((err) => {
  console.error('[ai-commit] 예외 발생:', err);
  process.exit(1);
});
