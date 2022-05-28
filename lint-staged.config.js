import {readFile, writeFile} from 'fs/promises';

const tsc = async (paths) => {
	const encoding = 'utf8';
	const originalTSConfigPath = 'tsconfig.json';
	// NOTE: MUST be in same directory.
	const lintStagedTSConfigPath = '.lint-staged.tsconfig.json';
	const originalTSConfig = JSON.parse(
		await readFile(originalTSConfigPath, encoding),
	);
	const lintStagedTSConfig = {
		...originalTSConfig,
		include: paths,
	};
	await writeFile(lintStagedTSConfigPath, JSON.stringify(lintStagedTSConfig));
	return `yarn tsc --noEmit --project ${lintStagedTSConfigPath}`;
};

const lint = 'yarn lint-and-fix';
const lintConfig = 'yarn lint-config-and-fix';

const config = {
	'*.{js,cjs,mjs,ts}': [lint],
	'*.ts': [tsc],
	'package.json,packages/*/package.json': [lintConfig],
};

export default config;
