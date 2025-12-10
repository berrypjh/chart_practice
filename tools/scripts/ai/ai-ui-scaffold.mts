import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createOpenAIClient, getOpenAIModel } from './openai-client.mts';

const client = createOpenAIClient('ai-ui');
const model = getOpenAIModel();

const readIfExists = async (filePath: string): Promise<string | null> => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
};

const stripCodeFence = (text: string): string => {
  let result = text.trim();

  // ```tsx ... ``` 형태를 제거
  const fenceMatch = result.match(/^```[a-zA-Z]*\s*([\s\S]*?)```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // 혹시 중간에만 ```가 있는 경우도 필터
  if (result.startsWith('```')) {
    result = result.replace(/^```[a-zA-Z]*\s*/, '');
  }
  if (result.endsWith('```')) {
    result = result.replace(/```$/, '');
  }

  result = result.replace(/^\s*import\s+React\s+from\s+['"]react['"];?\s*\r?\n?/gm, '');

  return result.trim();
};

const runFix = (files: string[]) => {
  if (!files.length) return;

  try {
    const args = files.map((f) => `"${f}"`).join(' ');
    console.log(`[ai-ui] eslint --fix 실행 중: ${args}`);
    execSync(`pnpm exec eslint --fix ${args}`, {
      stdio: 'inherit',
    });
  } catch {
    console.warn(
      '[ai-ui] eslint --fix 실행 중 오류가 발생했습니다. (테스트 코드/스토리는 그대로 생성됩니다.)',
    );
  }
};

const generateOrUpdateStory = async (
  uiPath: string,
  uiCode: string,
  storyPath: string,
  existingStory: string | null,
): Promise<string> => {
  const hasExisting = !!existingStory;
  const instructions = [
    '너는 React + Storybook 전문가야.',
    '입력으로 주어진 UI 컴포넌트 코드와 기존 Storybook 스토리(있다면)를 보고, 최신 상태에 맞는 스토리 파일을 작성해.',
    '',
    '요구사항:',
    '- TypeScript + React 19 + Storybook CSF 형식을 사용해.',
    '- 기본 export로 meta 객체를 제공해야 해:',
    '  const meta: Meta<typeof MyComponent> = { ... };',
    '  export default meta;',
    '- 최소 2~3개의 대표 스토리(예: Primary, Disabled, WithIcon 등)를 포함해.',
    '- props 타입 정보를 이용해 적절한 기본 args를 설정해.',
    '- 한국어 주석을 적당히 포함해서 스토리 용도를 설명해도 좋다.',
    '',
    hasExisting
      ? '- 기존 스토리가 있다면, **가능한 한 구조/이름을 유지**하면서 부족한 부분을 보완하거나 새로운 스토리를 추가해.'
      : '- 기존 스토리가 없다면, 완전히 새로운 스토리 파일을 생성해.',
    '- 기존 스토리 파일이 주어진 경우, **어떤 코드를 삭제할지는 신중히 판단**하고, 불필요한 중복이 아니라면 유지하도록 노력해.',
    '- 최종 출력은 스토리 파일 전체 TSX 코드만 제공해 (추가 설명 금지).',
    '- **마크다운 코드블록(````tsx`, ```ts` 등)은 절대 사용하지 말고, 순수 코드만 출력해.**',
  ].join('\n');

  const inputText =
    `UI 컴포넌트 파일 경로: ${uiPath}\n` +
    (hasExisting
      ? `기존 스토리 파일 경로: ${storyPath}\n\n` +
        '=== UI 컴포넌트 코드 ===\n' +
        uiCode +
        '\n\n=== 기존 스토리 코드 ===\n' +
        existingStory
      : '스토리 파일이 아직 없습니다.\n\n=== UI 컴포넌트 코드 ===\n' + uiCode);

  const response = await client.responses.create({
    model,
    instructions,
    input: [
      {
        role: 'user',
        content: inputText,
      },
    ],
    max_output_tokens: 2048,
  });

  const code = response.output_text?.trim();
  if (!code) {
    throw new Error('[ai-ui] Storybook 코드 생성에 실패했습니다.');
  }
  return stripCodeFence(code);
};

const generateOrUpdateTest = async (
  uiPath: string,
  uiCode: string,
  testPath: string,
  existingTest: string | null,
): Promise<string> => {
  const hasExisting = !!existingTest;
  const instructions = [
    '너는 React Testing Library + Vitest를 사용하는 프론트엔드 테스트 전문가야.',
    '입력으로 주어진 UI 컴포넌트 코드와 기존 테스트 코드(있다면)를 보고, 적절한 테스트 파일을 작성해.',
    '',
    '요구사항:',
    '- 테스트 러너는 Vitest(vitest) 기준으로 작성해.',
    '- React 컴포넌트 테스트는 @testing-library/react를 사용해.',
    '- describe/it 또는 describe/test 구조를 사용해.',
    '- 기본 렌더링, 주요 props 변화, 상호작용(onClick 등) 등을 검증하는 테스트 여러 개를 만든다.',
    '- 너무 과한 E2E 수준이 아니라, **컴포넌트 단위 유닛 테스트** 수준으로 작성해.',
    '- 한국어 주석을 적당히 포함해서 테스트 용도를 설명해도 좋아.',
    '',
    hasExisting
      ? '- 기존 테스트가 있다면, **기존 테스트 이름과 주요 시나리오는 존중**하면서 필요한 케이스를 보완하고, 깨진 테스트나 의미 없는 중복은 정리해.'
      : '- 기존 테스트가 없다면, 스켈레톤이 아니라 실제로 동작 가능한 기본 테스트들을 몇 개 작성해.',
    "- import 경로는 상대 경로를 사용해 (예: import { Button } from './Button';).",
    '- 최종 출력은 테스트 파일 전체 TS/TSX 코드만 제공해 (추가 설명 금지).',
    '- **마크다운 코드블록(````tsx`, ```ts` 등)은 절대 사용하지 말고, 순수 코드만 출력해.**',
  ].join('\n');

  const inputText =
    `UI 컴포넌트 파일 경로: ${uiPath}\n` +
    (hasExisting
      ? `기존 테스트 파일 경로: ${testPath}\n\n` +
        '=== UI 컴포넌트 코드 ===\n' +
        uiCode +
        '\n\n=== 기존 테스트 코드 ===\n' +
        existingTest
      : '테스트 파일이 아직 없습니다.\n\n=== UI 컴포넌트 코드 ===\n' + uiCode);

  const response = await client.responses.create({
    model,
    instructions,
    input: [
      {
        role: 'user',
        content: inputText,
      },
    ],
    max_output_tokens: 2048,
  });

  const code = response.output_text?.trim();
  if (!code) {
    throw new Error('[ai-ui] Test 코드 생성에 실패했습니다.');
  }

  return stripCodeFence(code);
};

const main = async () => {
  const [, , uiArg] = process.argv;
  if (!uiArg) {
    console.error(
      '사용법: pnpm ai:ui <UI 컴포넌트 tsx/ts 파일 경로>\n' +
        '예) pnpm ai:ui libs/ui/src/button/Button.tsx',
    );
    process.exit(1);
  }

  const uiPath = path.resolve(uiArg);
  let uiCode: string;
  try {
    uiCode = await fs.readFile(uiPath, 'utf8');
  } catch {
    console.error('[ai-ui] UI 컴포넌트 파일을 읽지 못했습니다:', uiPath);
    process.exit(1);
  }

  const dir = path.dirname(path.resolve(uiPath));
  const base = path.basename(path.resolve(uiPath)).replace(/\.tsx?$/, '');

  const storyPath = path.join(dir, `${base}.stories.tsx`);
  const testPath = path.join(dir, `${base}.spec.tsx`);

  const [existingStory, existingTest] = await Promise.all([
    readIfExists(storyPath),
    readIfExists(testPath),
  ]);

  console.log('[ai-ui] Storybook 스토리 생성/업데이트 중...');
  const storyCode = await generateOrUpdateStory(uiPath, uiCode, storyPath, existingStory);
  await fs.writeFile(storyPath, storyCode, 'utf8');
  console.log(`[ai-ui] Storybook 파일 완료: ${storyPath}`);

  console.log('[ai-ui] Test 코드 생성/업데이트 중...');
  const testCode = await generateOrUpdateTest(uiPath, uiCode, testPath, existingTest);
  await fs.writeFile(testPath, testCode, 'utf8');
  console.log(`[ai-ui] Test 파일 완료: ${testPath}`);

  runFix([storyPath, testPath]);

  console.log('\n[ai-ui] 완료되었습니다. 변경 내용을 git diff로 한 번 확인해 주세요.');
};

main().catch((err) => {
  console.error('[ai-ui] 예외 발생:', err);
  process.exit(1);
});
