import {assert, expect} from 'chai';

export {assert} from 'chai';

export const throws = async (
	fn: () => Promise<any>,
	expected: string | RegExp,
) => {
	let thrownError: any;
	try {
		await fn();
	} catch (error: unknown) {
		thrownError = error;
	}

	assert.notEqual(thrownError, undefined, 'Expected error to be thrown.');
	assert.instanceOf(
		thrownError,
		Error,
		'Expected thrown error to be an instance of Error.',
	);
	if (typeof expected === 'string') {
		expect(thrownError.message).to.equal(expected);
	} else if (expected instanceof RegExp) {
		expect(thrownError.message).to.match(expected);
	}
};
