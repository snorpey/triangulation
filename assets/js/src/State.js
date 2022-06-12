import { EventBus } from '../lib/EventBus.js';

export class State extends EventBus {
	constructor(initialState = {}) {
		super();

		this.id = Math.random();

		this._state = initialState || {};
		this._rafId;

		const me = this;

		const handler = {
			set(target, property, value) {
				target[property] = value;

				cancelAnimationFrame(me._rafId);

				me._rafId = requestAnimationFrame(() => {
					me.emit('state.update', me._state);
				});

				return true;
			},
		};

		this.state = new Proxy(this._state, handler);
	}

	update(key, value) {
		if (typeof key === 'string') {
			this.state[key] = value;
		}

		if (typeof key === 'object') {
			Object.keys(key).forEach(k => {
				this.state[k] = key[k];
			});
		}
	}
}

export const globalState = new State();
