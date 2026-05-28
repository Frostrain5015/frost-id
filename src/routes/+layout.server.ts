import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const locale = (cookies.get('frost-locale') as 'en' | 'zh') ?? 'zh';
	return { locale };
};
