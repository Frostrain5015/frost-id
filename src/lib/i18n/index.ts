import en from './en.json';
import zh from './zh.json';

export type Locale = 'en' | 'zh';
export type Translator = (key: string, vars?: Record<string, string>) => string;

const MESSAGES: Record<Locale, Record<string, unknown>> = { en, zh };

function lookup(obj: Record<string, unknown>, dotKey: string): string | undefined {
	const parts = dotKey.split('.');
	let cur: unknown = obj;
	for (const p of parts) {
		if (cur == null || typeof cur !== 'object') return undefined;
		cur = (cur as Record<string, unknown>)[p];
	}
	return typeof cur === 'string' ? cur : undefined;
}

export function createTranslator(locale: Locale): Translator {
	return (key: string, vars?: Record<string, string>): string => {
		let str = lookup(MESSAGES[locale], key) ?? lookup(MESSAGES.en, key) ?? key;
		if (vars) {
			for (const [k, v] of Object.entries(vars)) {
				str = str.replaceAll(`{${k}}`, v);
			}
		}
		return str;
	};
}
