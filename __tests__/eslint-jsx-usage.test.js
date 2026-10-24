const { ESLint } = require('eslint');

test('JSX component references count as uses while genuinely unused imports are reported', async () => {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: require('../eslint.config') });
  const [result] = await eslint.lintText(
    "import Used from './Used';\nimport Unused from './Unused';\nexport default function Example() { return <Used />; }\n",
    { filePath: 'components/LintExample.js' },
  );
  const unused = result.messages.filter((message) => message.ruleId === 'no-unused-vars');
  expect(unused).toHaveLength(1);
  expect(unused[0].message).toContain('Unused');
  expect(result.errorCount).toBe(0);
});
