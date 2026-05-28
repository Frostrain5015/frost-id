import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/session.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	await destroySession(cookies);
	throw redirect(302, '/login');
};

export const POST: RequestHandler = async ({ cookies }) => {
	await destroySession(cookies);
	throw redirect(302, '/login');
};
