/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	DB: D1Database
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

interface Comment {
	id: string;
	content: string;
	createdAt: string;
	nickname: string;
}

interface PostCommentBody {
	content: string;
	nickname: string;
}
interface UpdateCommentBody {
	id: string;
	content: string;
}
// 查询所有评论
const getComments = async (env: Env, page: number, pageSize: number) => {
	const { results } = await env.DB.prepare(
		'SELECT * FROM Comments ORDER BY rowid DESC LIMIT ? OFFSET ?'
	)
		.bind(pageSize, (page - 1) * pageSize)
		.all<Comment>();

	const res = await env.DB.prepare(
		`SELECT COUNT(*) as count FROM Comments`
	).first<{ count: number }>();

	return Response.json({
		data: results,
		total: res.count,
	});
};

// 按昵称查询评论
// http://127.0.0.1:8787/api/comment?nickName=jack
// npx wrangler d1 execute demo_db --local --command="SELECT * FROM Comments WHERE nickname='jack'"
const getComment = async (env: Env, page: number, pageSize: number, nickName: string) => {
	console.log('debug', nickName)
	const condition = 'WHERE nickname = ?'
	const { results } = await env.DB.prepare(
		'SELECT * FROM Comments WHERE nickname = ? ORDER BY rowid DESC LIMIT ? OFFSET ?'
	)
		.bind(nickName, pageSize, (page - 1) * pageSize)
		.all<Comment>();

	const res = await env.DB.prepare(
		`SELECT COUNT(*) as count FROM Comments WHERE nickname = ?`
	)
		.bind(nickName)
		.first<{ count: number }>();

	return Response.json({
		data: results,
		total: res.count,
	});
};

const postComment = async (env: Env, content: string, nickname: string) => {
	const uuid = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	await env.DB.prepare(
		`INSERT INTO Comments(id,createdAt,content,nickname) VALUES (?,?,?,?)`
	)
		.bind(uuid, createdAt, content, nickname)
		.run();

	return Response.json({ message: 'ok' });
};

// npx wrangler d1 execute demo_db --local --command="UPDATE Comments SET content = 'new1', updatedAt = '2023' WHERE id = '5c8e6d8f-338b-45f9-a859-9999740df6ec'"
const updateComment = async (env: Env, id: string, content: string) => {
	const updatedAt = new Date().toISOString();

	await env.DB.prepare(
		`UPDATE Comments SET content = ?, updatedAt = ? WHERE id = ?`
	)
		.bind(content, updatedAt, id)
		.run();

	return Response.json({ message: 'ok' });
};

const deleteComment = async (env: Env, id: string) => {
	await env.DB.prepare(`DELETE FROM Comments WHERE id = ?`)
		.bind(id)
		.run();
	return Response.json({ message: 'ok' });
};

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const { pathname, searchParams } = new URL(request.url);

		if (pathname === '/') {
			return new Response("Hello World!");
		}

		if (request.method === 'GET') {
			if (pathname === '/api/comment') {
				const page = Number(searchParams.get('page')) || 1;
				const pageSize = Number(searchParams.get('pageSize')) || 10;
				const nickName = searchParams.get('nickName') || '';
				return await getComment(env, page, pageSize, nickName);
			} else if (pathname === '/api/comments') {
				const page = Number(searchParams.get('page')) || 1;
				const pageSize = Number(searchParams.get('pageSize')) || 10;
				return await getComments(env, page, pageSize);
			}
		} else if (request.method === 'POST') {
			if (pathname === '/api/comment/add') {
				const body = await request.json<PostCommentBody>();
				const { content, nickname } = body;
	
				// 一些简单的校验
				if (
					!content ||
					!nickname ||
					content.length > 255 ||
					nickname.length > 100
				) {
					return new Response(null, { status: 400 });
				}
	
				return await postComment(env, body.content, body.nickname);
			} else if (pathname === '/api/comment/update') {
				const body = await request.json<UpdateCommentBody>();
				const { content, id } = body;
				return await updateComment(env, id, content);
			} else if (pathname === '/api/comment/delete') {
				const body = await request.json<UpdateCommentBody>();
				const { content, id } = body;
				return await deleteComment(env, id);
			}
		}

		return new Response(null, { status: 404 });;
	},
};
