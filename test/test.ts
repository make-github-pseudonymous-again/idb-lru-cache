import test from 'xn--mxaac';

import {cache, Value} from '../src/mod';
import {assert, throws} from './_fixtures';

const beginningOfTime = () => new Date('2000-01-01');
const endOfTime = () => new Date('2030-01-01');

test('set/has', async () => {
	const lru = cache<string, number>({
		dbName: 'cache-lru',
		maxCount: 10,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, i, {expiry: endOfTime()});
		assert(await lru.has(`${i}`));
	}

	for (let i = 0; i < 100; ++i) {
		const has = await lru.has(`${i}`);
		assert(has === i >= 90);
	}
});

test('persists', async () => {
	const lru = cache<string, number>({
		dbName: 'cache-lru',
		maxCount: 10,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, i, {expiry: endOfTime()});
	}

	const lru2 = cache<string, number>({
		dbName: 'cache-lru',
		maxCount: 10,
	});

	for (let i = 0; i < 100; ++i) {
		const has = await lru2.has(`${i}`);
		assert(has === i >= 90);
	}
});

test('count', async () => {
	const maxCount = 10;
	const lru = cache<string, number>({
		dbName: 'cache-lru',
		maxCount,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, i, {expiry: endOfTime()});
		assert((await lru.count()) === Math.min(i + 1, maxCount));
	}
});

test('get', async () => {
	const lru = cache<string, number>({
		dbName: 'cache-lru',
		maxCount: 10,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, i, {expiry: endOfTime()});
	}

	for (let i = 0; i < 90; ++i) {
		await throws(async () => lru.get(`${i}`), /not found/);
	}

	for (let i = 90; i < 100; ++i) {
		const {key, value} = await lru.get(`${i}`);
		assert(key === `${i}`);
		assert(value === i);
	}
});

test('clear', async () => {
	const lru = cache({
		dbName: 'cache-lru',
		maxCount: 10,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, `${i}`, {expiry: endOfTime()});
		assert(await lru.has(`${i}`));
	}

	await lru.clear();

	for (let i = 0; i < 100; ++i) {
		const has = await lru.has(`${i}`);
		assert(!has);
	}
});

test('evict', async () => {
	const lru = cache({
		dbName: 'cache-lru',
		maxCount: 10,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, `${i}`, {expiry: endOfTime()});
		assert(await lru.has(`${i}`));
	}

	await lru.evict(5);

	for (let i = 0; i < 100; ++i) {
		const has = await lru.has(`${i}`);
		assert(has === i >= 95);
	}
});

test('delete', async () => {
	const lru = cache({
		dbName: 'cache-lru',
		maxCount: 10,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, `${i}`, {expiry: endOfTime()});
		assert(await lru.has(`${i}`));
	}

	for (let i = 0; i < 100; ++i) {
		await lru.delete(`${i}`);
		const has = await lru.has(`${i}`);
		assert(!has);
	}
});

test('expiry', async () => {
	const lru = cache({
		dbName: 'cache-lru',
		maxCount: 1000,
	});

	for (let i = 0; i < 100; ++i) {
		await lru.set(`${i}`, `${i}`, {expiry: beginningOfTime()});
		assert(!(await lru.has(`${i}`)));
	}
});

test('resize', async () => {
	const lru = cache({
		dbName: 'cache-lru',
		maxCount: 50,
	});

	assert((await lru.count()) === 0, 'assert count is 0');

	for (let i = 0; i < 20; ++i) {
		await lru.set(`${i}`, `${i}`, {expiry: endOfTime()});
	}

	await lru.resize(10);

	for (let i = 0; i < 20; ++i) {
		const has = await lru.has(`${i}`);
		assert(has === i >= 10, `before ${i}`);
	}

	for (let i = 0; i < 10; ++i) {
		await lru.set(`${i}`, `${i}`, {expiry: endOfTime()});
	}

	for (let i = 0; i < 20; ++i) {
		const has = await lru.has(`${i}`);
		assert(has === i < 10, `after ${i}`);
	}
});

test('upsert', async () => {
	const lru = cache<number, number>({
		dbName: 'cache-lru',
		maxCount: 50,
	});

	const key = Math.random();
	const zero = () => ({value: 0, expiry: endOfTime()});
	const inc = ({value, expiry}: Value<number, number>) => ({
		value: value + 1,
		expiry,
	});

	const operations = [
		lru.upsert(key, zero, inc),
		lru.upsert(key, zero, inc),
		lru.upsert(key, zero, inc),
		lru.upsert(key, zero, inc),
		lru.upsert(key, zero, inc),
		lru.upsert(key, zero, inc),
	];

	await Promise.all(operations);

	const {value} = await lru.get(key);
	assert(value === operations.length - 1);
});

test('update', async () => {
	const lru = cache<number, number>({
		dbName: 'cache-lru',
		maxCount: 50,
	});

	const key = Math.random();

	await lru.set(key, 0, {expiry: endOfTime()});

	const inc = ({value, expiry}: Value<number, number>) => ({
		value: value + 1,
		expiry,
	});

	const increments = [
		lru.update(key, inc),
		lru.update(key, inc),
		lru.update(key, inc),
		lru.update(key, inc),
		lru.update(key, inc),
		lru.update(key, inc),
	];

	await Promise.all(increments);

	const {value} = await lru.get(key);
	assert(value === increments.length);
});
