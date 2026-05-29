import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from './$types';

const AVATARS_DIR = path.resolve('static/avatars');
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file || !(file instanceof File) || file.size === 0) {
		return json({ error: 'No file provided' }, { status: 400 });
	}
	if (file.size > MAX_SIZE) {
		return json({ error: 'File too large (max 2MB)' }, { status: 400 });
	}
	if (!ALLOWED_TYPES.includes(file.type)) {
		return json({ error: 'Only PNG, JPEG, WebP, GIF allowed' }, { status: 400 });
	}

	if (!existsSync(AVATARS_DIR)) {
		await mkdir(AVATARS_DIR, { recursive: true });
	}

	const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'gif';
	const filename = `${nanoid(12)}.${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(path.join(AVATARS_DIR, filename), buffer);

	return json({ url: `/avatars/${filename}` });
};
