import 'mocha';
import * as chai from 'chai';
import {sleep, SleepAbortError} from '../src/index.js';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('sleep', () => {
	describe('sleep abort without throw', () => {
		it('should sleep', async function () {
			this.slow(120);
			this.timeout(190);
			const start = new Date().getTime();
			await sleep(100);
			const time = new Date().getTime() - start;
			expect(time).to.be.greaterThanOrEqual(100);
		});
		it('should abort sleep early', async function () {
			this.timeout(10);
			const controller = new AbortController();
			controller.abort();
			const start = new Date().getTime();
			await sleep(100, {signal: controller.signal});
			const time = new Date().getTime() - start;
			expect(time).to.be.lessThanOrEqual(10);
		});
		it('should abort middle of sleep', async function () {
			this.slow(120);
			this.timeout(190);
			const controller = new AbortController();
			const start = new Date().getTime();
			setTimeout(() => controller.abort(), 100);
			await sleep(200, {signal: controller.signal});
			const time = new Date().getTime() - start;
			expect(time).to.be.greaterThanOrEqual(100).and.lessThan(150);
		});
	});
	describe('sleep abort with throw', () => {
		it('should abort sleep early', async function () {
			this.timeout(10);
			const controller = new AbortController();
			controller.abort();
			const start = new Date().getTime();
			await expect(sleep(100, {signal: controller.signal, abortThrows: true})).to.be.rejectedWith(SleepAbortError, 'Aborted');
			const time = new Date().getTime() - start;
			expect(time).to.be.lessThanOrEqual(10);
		});
		it('should abort middle of sleep', async function () {
			this.slow(120);
			this.timeout(190);
			const controller = new AbortController();
			const start = new Date().getTime();
			setTimeout(() => controller.abort(), 100);
			await expect(sleep(200, {signal: controller.signal, abortThrows: true})).to.be.rejectedWith(SleepAbortError, 'Aborted');
			const time = new Date().getTime() - start;
			expect(time).to.be.greaterThanOrEqual(100).and.lessThan(150);
		});
	});
	describe('multiple sleeps on same signal', () => {
		it('should abort both sleep promises', async function () {
			this.timeout(500);
			this.slow(400);
			const abortController = new AbortController();
			const value1Promise = sleep(1000, {signal: abortController.signal});
			const value2Promise = sleep(1000, {signal: abortController.signal});
			setTimeout(() => abortController.abort(), 100);
			await expect(value1Promise).to.be.eventually.eq(undefined);
			await expect(value2Promise).to.be.eventually.eq(undefined);
		});
	});
});
