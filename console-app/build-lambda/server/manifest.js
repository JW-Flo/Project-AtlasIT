const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.DvySRxJ5.js",app:"_app/immutable/entry/app.BTH7iHA1.js",imports:["_app/immutable/entry/start.DvySRxJ5.js","_app/immutable/chunks/DEfbl42g.js","_app/immutable/chunks/Brc9Lj5R.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/DrIfTPVU.js","_app/immutable/entry/app.BTH7iHA1.js","_app/immutable/chunks/BJdZynKW.js","_app/immutable/chunks/DYSRzf4F.js","_app/immutable/chunks/ByyiFnrn.js","_app/immutable/chunks/ClsUfVDQ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-4WzfTU1Z.js')),
			__memo(() => import('./chunks/1-DkuHpAyJ.js')),
			__memo(() => import('./chunks/2-CxoinL0T.js')),
			__memo(() => import('./chunks/3-BULSHoXC.js')),
			__memo(() => import('./chunks/4-CjyiYkNU.js')),
			__memo(() => import('./chunks/5-BxBDSRJB.js')),
			__memo(() => import('./chunks/6-CD6bxX99.js')),
			__memo(() => import('./chunks/7-Bd3jFmyN.js')),
			__memo(() => import('./chunks/8-9hqZU1U1.js')),
			__memo(() => import('./chunks/9-CbxWjD1y.js')),
			__memo(() => import('./chunks/10-BAg5ScJN.js')),
			__memo(() => import('./chunks/11-DFq20SOC.js')),
			__memo(() => import('./chunks/12-CQe8ZKWb.js')),
			__memo(() => import('./chunks/13-q74SzR7A.js')),
			__memo(() => import('./chunks/14-DBjLfhk0.js')),
			__memo(() => import('./chunks/15-7IqRIUT4.js')),
			__memo(() => import('./chunks/16-BMVCQaww.js')),
			__memo(() => import('./chunks/17-Qc0B0XyN.js')),
			__memo(() => import('./chunks/18-CKyNA4fV.js')),
			__memo(() => import('./chunks/19-B6y4KiFC.js')),
			__memo(() => import('./chunks/20-B54auCa_.js')),
			__memo(() => import('./chunks/21-DBl-Fayl.js')),
			__memo(() => import('./chunks/22-u37ZHGEH.js')),
			__memo(() => import('./chunks/23-CsyvcSRX.js')),
			__memo(() => import('./chunks/24-DEo9OJC7.js')),
			__memo(() => import('./chunks/25-DaPqyHPH.js')),
			__memo(() => import('./chunks/26-COa341nc.js')),
			__memo(() => import('./chunks/27-DIlagWAx.js')),
			__memo(() => import('./chunks/28-BdUjQfXk.js')),
			__memo(() => import('./chunks/29-CO3IsJaP.js')),
			__memo(() => import('./chunks/30-DK6CO5eh.js')),
			__memo(() => import('./chunks/31-BC5EqyRL.js')),
			__memo(() => import('./chunks/32-D6UOXPLh.js')),
			__memo(() => import('./chunks/33-D-RFk1nE.js')),
			__memo(() => import('./chunks/34-CjKtKimy.js')),
			__memo(() => import('./chunks/35-CehCumY4.js')),
			__memo(() => import('./chunks/36-BxUNukyK.js')),
			__memo(() => import('./chunks/37-DNct-hpP.js')),
			__memo(() => import('./chunks/38-C5oURuab.js')),
			__memo(() => import('./chunks/39-B4i0XuI_.js')),
			__memo(() => import('./chunks/40-Bbn3l0Ai.js')),
			__memo(() => import('./chunks/41-BTGODgJn.js')),
			__memo(() => import('./chunks/42-ehARWqaB.js')),
			__memo(() => import('./chunks/43-LeSmPQyy.js')),
			__memo(() => import('./chunks/44-Knug-AQ-.js')),
			__memo(() => import('./chunks/45-Dk1kgD4g.js')),
			__memo(() => import('./chunks/46-BS97E9GW.js')),
			__memo(() => import('./chunks/47-CRjyOHbo.js')),
			__memo(() => import('./chunks/48-D_zkIBze.js')),
			__memo(() => import('./chunks/49-BLMSuGiB.js')),
			__memo(() => import('./chunks/50-DpATWYH6.js')),
			__memo(() => import('./chunks/51-BOfvg4c0.js')),
			__memo(() => import('./chunks/52-BNkmAjQu.js')),
			__memo(() => import('./chunks/53-Dxkw-xlD.js')),
			__memo(() => import('./chunks/54-DvL4ib3R.js')),
			__memo(() => import('./chunks/55-idExFL-b.js')),
			__memo(() => import('./chunks/56-jHycSoFz.js')),
			__memo(() => import('./chunks/57-CNVkXa3t.js')),
			__memo(() => import('./chunks/58-CApZh1jx.js')),
			__memo(() => import('./chunks/59-DI1dEHNe.js')),
			__memo(() => import('./chunks/60-Dd0nkX32.js')),
			__memo(() => import('./chunks/61-BWSfURkv.js')),
			__memo(() => import('./chunks/62-CfEMWSlV.js')),
			__memo(() => import('./chunks/63-3pZPx8OQ.js')),
			__memo(() => import('./chunks/64-Bq8J-rMX.js')),
			__memo(() => import('./chunks/65-e1-yJhhZ.js')),
			__memo(() => import('./chunks/66-DtkEloDY.js')),
			__memo(() => import('./chunks/67-B8w2qRe7.js')),
			__memo(() => import('./chunks/68-Dn2QSKry.js')),
			__memo(() => import('./chunks/69-BO_6xg1-.js')),
			__memo(() => import('./chunks/70-sJiKLbHV.js')),
			__memo(() => import('./chunks/71-DQuYIsTP.js')),
			__memo(() => import('./chunks/72-CTMtfaNA.js')),
			__memo(() => import('./chunks/73-D0mvg1WG.js')),
			__memo(() => import('./chunks/74-Cv8Dzc0u.js')),
			__memo(() => import('./chunks/75-CyfgJF7T.js')),
			__memo(() => import('./chunks/76-DD6hcN_-.js')),
			__memo(() => import('./chunks/77-Bi7-xERt.js')),
			__memo(() => import('./chunks/78-DNqh9LtL.js')),
			__memo(() => import('./chunks/79-Ba6Tv95B.js')),
			__memo(() => import('./chunks/80-BDjdgeyB.js')),
			__memo(() => import('./chunks/81-BuujXTD4.js')),
			__memo(() => import('./chunks/82-DdlSuVJD.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/accept-invite",
				pattern: /^\/accept-invite\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/access-requests",
				pattern: /^\/access-requests\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/api/access-requests",
				pattern: /^\/api\/access-requests\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C0k-2M4a.js'))
			},
			{
				id: "/api/access-requests/[id]/[action]",
				pattern: /^\/api\/access-requests\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"action","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D36R4HF5.js'))
			},
			{
				id: "/api/access-reviews",
				pattern: /^\/api\/access-reviews\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B6Hf9hTN.js'))
			},
			{
				id: "/api/access-reviews/[id]",
				pattern: /^\/api\/access-reviews\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DHUSZeCh.js'))
			},
			{
				id: "/api/access-reviews/[id]/decisions",
				pattern: /^\/api\/access-reviews\/([^/]+?)\/decisions\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BxFGyWAM.js'))
			},
			{
				id: "/api/access-reviews/[id]/items",
				pattern: /^\/api\/access-reviews\/([^/]+?)\/items\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-_snKc6oI.js'))
			},
			{
				id: "/api/activity",
				pattern: /^\/api\/activity\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DHnhemKt.js'))
			},
			{
				id: "/api/admin/demo/reset",
				pattern: /^\/api\/admin\/demo\/reset\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D8NLQoO6.js'))
			},
			{
				id: "/api/admin/impersonate/exit",
				pattern: /^\/api\/admin\/impersonate\/exit\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DaMZpBBP.js'))
			},
			{
				id: "/api/admin/tenants",
				pattern: /^\/api\/admin\/tenants\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ga1pNZKv.js'))
			},
			{
				id: "/api/admin/tenants/[id]",
				pattern: /^\/api\/admin\/tenants\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ss6odhVM.js'))
			},
			{
				id: "/api/admin/tenants/[id]/impersonate",
				pattern: /^\/api\/admin\/tenants\/([^/]+?)\/impersonate\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DO1VmJWr.js'))
			},
			{
				id: "/api/admin/users/reset-password",
				pattern: /^\/api\/admin\/users\/reset-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-aJ31b2sN.js'))
			},
			{
				id: "/api/analytics/dashboard",
				pattern: /^\/api\/analytics\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D8Mf28yj.js'))
			},
			{
				id: "/api/analytics/events",
				pattern: /^\/api\/analytics\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BEzvE4ir.js'))
			},
			{
				id: "/api/analytics/report",
				pattern: /^\/api\/analytics\/report\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CsmBOOjD.js'))
			},
			{
				id: "/api/apps/connect",
				pattern: /^\/api\/apps\/connect\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CdHd4Ktw.js'))
			},
			{
				id: "/api/apps/credentials",
				pattern: /^\/api\/apps\/credentials\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DG_md57q.js'))
			},
			{
				id: "/api/apps/disconnect",
				pattern: /^\/api\/apps\/disconnect\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-OG23pR8N.js'))
			},
			{
				id: "/api/apps/lifecycle/movement",
				pattern: /^\/api\/apps\/lifecycle\/movement\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B3EQgw23.js'))
			},
			{
				id: "/api/apps/lifecycle/workflows",
				pattern: /^\/api\/apps\/lifecycle\/workflows\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BORa_Zha.js'))
			},
			{
				id: "/api/apps/oauth/callback",
				pattern: /^\/api\/apps\/oauth\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DVGEoY0P.js'))
			},
			{
				id: "/api/apps/oauth/start",
				pattern: /^\/api\/apps\/oauth\/start\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dko9vQyK.js'))
			},
			{
				id: "/api/apps/status",
				pattern: /^\/api\/apps\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DR2_MAgu.js'))
			},
			{
				id: "/api/apps/test",
				pattern: /^\/api\/apps\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BQ714meK.js'))
			},
			{
				id: "/api/apps/[appId]/groups",
				pattern: /^\/api\/apps\/([^/]+?)\/groups\/?$/,
				params: [{"name":"appId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-M9zDQIMr.js'))
			},
			{
				id: "/api/apps/[appId]/groups/[groupId]",
				pattern: /^\/api\/apps\/([^/]+?)\/groups\/([^/]+?)\/?$/,
				params: [{"name":"appId","optional":false,"rest":false,"chained":false},{"name":"groupId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DdZnm-le.js'))
			},
			{
				id: "/api/apps/[appId]/roles",
				pattern: /^\/api\/apps\/([^/]+?)\/roles\/?$/,
				params: [{"name":"appId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DwsIIHab.js'))
			},
			{
				id: "/api/apps/[appId]/roles/[sourceRole]",
				pattern: /^\/api\/apps\/([^/]+?)\/roles\/([^/]+?)\/?$/,
				params: [{"name":"appId","optional":false,"rest":false,"chained":false},{"name":"sourceRole","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DiIroS6E.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-8Rft1Dfw.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DXzk5Yhy.js'))
			},
			{
				id: "/api/auth/mfa/confirm",
				pattern: /^\/api\/auth\/mfa\/confirm\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BaObQq41.js'))
			},
			{
				id: "/api/auth/mfa/disable",
				pattern: /^\/api\/auth\/mfa\/disable\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BKiNac36.js'))
			},
			{
				id: "/api/auth/mfa/setup",
				pattern: /^\/api\/auth\/mfa\/setup\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B--G0FKd.js'))
			},
			{
				id: "/api/auth/mfa/status",
				pattern: /^\/api\/auth\/mfa\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DzJc_smC.js'))
			},
			{
				id: "/api/auth/mfa/verify",
				pattern: /^\/api\/auth\/mfa\/verify\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DS0aNN-C.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-qJ9d3cd_.js'))
			},
			{
				id: "/api/auth/session",
				pattern: /^\/api\/auth\/session\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BitolFao.js'))
			},
			{
				id: "/api/auth/sso/callback",
				pattern: /^\/api\/auth\/sso\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-ov75D3lb.js'))
			},
			{
				id: "/api/auth/sso/init",
				pattern: /^\/api\/auth\/sso\/init\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BahLzxFQ.js'))
			},
			{
				id: "/api/auth/sso/metadata",
				pattern: /^\/api\/auth\/sso\/metadata\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DqXC76-X.js'))
			},
			{
				id: "/api/automation/compliance-summary",
				pattern: /^\/api\/automation\/compliance-summary\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CYAKY3tp.js'))
			},
			{
				id: "/api/automation/evaluate",
				pattern: /^\/api\/automation\/evaluate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BHr_hNC0.js'))
			},
			{
				id: "/api/automation/executions",
				pattern: /^\/api\/automation\/executions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DwC_v3Dd.js'))
			},
			{
				id: "/api/automation/executions/[id]",
				pattern: /^\/api\/automation\/executions\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CRfadCJM.js'))
			},
			{
				id: "/api/automation/health",
				pattern: /^\/api\/automation\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DkrpI_Ls.js'))
			},
			{
				id: "/api/automation/nl",
				pattern: /^\/api\/automation\/nl\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-cPp_QIS0.js'))
			},
			{
				id: "/api/automation/rules",
				pattern: /^\/api\/automation\/rules\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CW5O-RH8.js'))
			},
			{
				id: "/api/automation/rules/[id]",
				pattern: /^\/api\/automation\/rules\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CAZaxG4T.js'))
			},
			{
				id: "/api/automation/rules/[id]/compliance",
				pattern: /^\/api\/automation\/rules\/([^/]+?)\/compliance\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CAR5zt_u.js'))
			},
			{
				id: "/api/automation/rules/[id]/duplicate",
				pattern: /^\/api\/automation\/rules\/([^/]+?)\/duplicate\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DfDeYmeC.js'))
			},
			{
				id: "/api/automation/simulate",
				pattern: /^\/api\/automation\/simulate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DRlVsuWh.js'))
			},
			{
				id: "/api/automation/simulations",
				pattern: /^\/api\/automation\/simulations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CFci2DER.js'))
			},
			{
				id: "/api/automation/stats",
				pattern: /^\/api\/automation\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cvsoyxbu.js'))
			},
			{
				id: "/api/automation/suggestions",
				pattern: /^\/api\/automation\/suggestions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-ChNvUZpf.js'))
			},
			{
				id: "/api/automation/templates",
				pattern: /^\/api\/automation\/templates\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BVOQnhcR.js'))
			},
			{
				id: "/api/billing",
				pattern: /^\/api\/billing\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-r321_j-l.js'))
			},
			{
				id: "/api/billing/checkout",
				pattern: /^\/api\/billing\/checkout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-xFq_CxSJ.js'))
			},
			{
				id: "/api/billing/portal",
				pattern: /^\/api\/billing\/portal\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dmq_F75M.js'))
			},
			{
				id: "/api/billing/seats",
				pattern: /^\/api\/billing\/seats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BC9d-PZF.js'))
			},
			{
				id: "/api/billing/usage",
				pattern: /^\/api\/billing\/usage\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BM2R72nK.js'))
			},
			{
				id: "/api/billing/webhook",
				pattern: /^\/api\/billing\/webhook\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CkEr4H9a.js'))
			},
			{
				id: "/api/compliance-intelligence/anomalies",
				pattern: /^\/api\/compliance-intelligence\/anomalies\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cfm7ga5R.js'))
			},
			{
				id: "/api/compliance-intelligence/drift",
				pattern: /^\/api\/compliance-intelligence\/drift\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C1s4QoK9.js'))
			},
			{
				id: "/api/compliance-intelligence/gaps",
				pattern: /^\/api\/compliance-intelligence\/gaps\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-X7L-4sVP.js'))
			},
			{
				id: "/api/compliance-intelligence/policies/generate",
				pattern: /^\/api\/compliance-intelligence\/policies\/generate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DujeiWlc.js'))
			},
			{
				id: "/api/compliance-packs",
				pattern: /^\/api\/compliance-packs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DQv2S-yx.js'))
			},
			{
				id: "/api/compliance-packs/install",
				pattern: /^\/api\/compliance-packs\/install\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CoEIy--M.js'))
			},
			{
				id: "/api/compliance-packs/[id]",
				pattern: /^\/api\/compliance-packs\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bf9sGXco.js'))
			},
			{
				id: "/api/config",
				pattern: /^\/api\/config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-g-ISo3zM.js'))
			},
			{
				id: "/api/copilot/actions",
				pattern: /^\/api\/copilot\/actions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B6bU9SST.js'))
			},
			{
				id: "/api/copilot/audit-prep",
				pattern: /^\/api\/copilot\/audit-prep\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-_8eu6i18.js'))
			},
			{
				id: "/api/copilot/chat",
				pattern: /^\/api\/copilot\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-umOOuAPh.js'))
			},
			{
				id: "/api/copilot/digest",
				pattern: /^\/api\/copilot\/digest\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CC_7Ikv_.js'))
			},
			{
				id: "/api/copilot/smart-alerts",
				pattern: /^\/api\/copilot\/smart-alerts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-mWUPbPmO.js'))
			},
			{
				id: "/api/copilot/weekly-digest",
				pattern: /^\/api\/copilot\/weekly-digest\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bi72GLWa.js'))
			},
			{
				id: "/api/dashboard/export",
				pattern: /^\/api\/dashboard\/export\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ca0i0lRo.js'))
			},
			{
				id: "/api/dashboard/views",
				pattern: /^\/api\/dashboard\/views\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D6zYhgWx.js'))
			},
			{
				id: "/api/dead-letter",
				pattern: /^\/api\/dead-letter\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CXDRK1LN.js'))
			},
			{
				id: "/api/dead-letter/[id]",
				pattern: /^\/api\/dead-letter\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CfdcpWxw.js'))
			},
			{
				id: "/api/demo/events",
				pattern: /^\/api\/demo\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DAJb5U3n.js'))
			},
			{
				id: "/api/directory/connect",
				pattern: /^\/api\/directory\/connect\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C7vjk-1g.js'))
			},
			{
				id: "/api/directory/groups",
				pattern: /^\/api\/directory\/groups\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B6g967FJ.js'))
			},
			{
				id: "/api/directory/groups/[id]",
				pattern: /^\/api\/directory\/groups\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BsU93Y3y.js'))
			},
			{
				id: "/api/directory/groups/[id]/members",
				pattern: /^\/api\/directory\/groups\/([^/]+?)\/members\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-oWzV7SO8.js'))
			},
			{
				id: "/api/directory/mappings",
				pattern: /^\/api\/directory\/mappings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DF2u4tbj.js'))
			},
			{
				id: "/api/directory/mappings/suggest",
				pattern: /^\/api\/directory\/mappings\/suggest\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bo_IT1iv.js'))
			},
			{
				id: "/api/directory/mappings/[id]",
				pattern: /^\/api\/directory\/mappings\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CrSQq_5w.js'))
			},
			{
				id: "/api/directory/sync",
				pattern: /^\/api\/directory\/sync\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DD_CTKq5.js'))
			},
			{
				id: "/api/directory/sync/status",
				pattern: /^\/api\/directory\/sync\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cct27nTy.js'))
			},
			{
				id: "/api/directory/users",
				pattern: /^\/api\/directory\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BD41GAQf.js'))
			},
			{
				id: "/api/directory/users/[id]",
				pattern: /^\/api\/directory\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C6TTdwrH.js'))
			},
			{
				id: "/api/discovery",
				pattern: /^\/api\/discovery\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CoAADBos.js'))
			},
			{
				id: "/api/discovery/[id]",
				pattern: /^\/api\/discovery\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BMdczp3P.js'))
			},
			{
				id: "/api/errors",
				pattern: /^\/api\/errors\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BVgPtq98.js'))
			},
			{
				id: "/api/evidence-collection/collect",
				pattern: /^\/api\/evidence-collection\/collect\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-KmNkvZ3I.js'))
			},
			{
				id: "/api/evidence-feed",
				pattern: /^\/api\/evidence-feed\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D0LFJIK5.js'))
			},
			{
				id: "/api/evidence-feed/stream",
				pattern: /^\/api\/evidence-feed\/stream\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B1Qn6NS3.js'))
			},
			{
				id: "/api/evidence/tags",
				pattern: /^\/api\/evidence\/tags\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D3WqeYxt.js'))
			},
			{
				id: "/api/evidence/[id]/tags",
				pattern: /^\/api\/evidence\/([^/]+?)\/tags\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DBxX84ON.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CV_4eCyh.js'))
			},
			{
				id: "/api/incidents",
				pattern: /^\/api\/incidents\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DkeQnlVn.js'))
			},
			{
				id: "/api/incidents/classify",
				pattern: /^\/api\/incidents\/classify\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BbelQVxi.js'))
			},
			{
				id: "/api/incidents/sla-config",
				pattern: /^\/api\/incidents\/sla-config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BsuCRtpo.js'))
			},
			{
				id: "/api/incidents/[id]",
				pattern: /^\/api\/incidents\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dox9jwmo.js'))
			},
			{
				id: "/api/incidents/[id]/assign",
				pattern: /^\/api\/incidents\/([^/]+?)\/assign\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dm73qcEq.js'))
			},
			{
				id: "/api/incidents/[id]/escalate",
				pattern: /^\/api\/incidents\/([^/]+?)\/escalate\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CXBXEhmp.js'))
			},
			{
				id: "/api/incidents/[id]/resolve",
				pattern: /^\/api\/incidents\/([^/]+?)\/resolve\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bkhu0rVC.js'))
			},
			{
				id: "/api/incidents/[id]/severity",
				pattern: /^\/api\/incidents\/([^/]+?)\/severity\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CeACC_Jh.js'))
			},
			{
				id: "/api/incidents/[id]/status",
				pattern: /^\/api\/incidents\/([^/]+?)\/status\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ih5r5pCA.js'))
			},
			{
				id: "/api/incidents/[id]/timeline",
				pattern: /^\/api\/incidents\/([^/]+?)\/timeline\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bi2j7u3t.js'))
			},
			{
				id: "/api/integrations/connected",
				pattern: /^\/api\/integrations\/connected\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DwWoUR4U.js'))
			},
			{
				id: "/api/integrations/health",
				pattern: /^\/api\/integrations\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Drtyq7ZY.js'))
			},
			{
				id: "/api/jml/changelog",
				pattern: /^\/api\/jml\/changelog\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-bnhiupds.js'))
			},
			{
				id: "/api/jml/policy",
				pattern: /^\/api\/jml\/policy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DlHZeOjO.js'))
			},
			{
				id: "/api/jml/runs",
				pattern: /^\/api\/jml\/runs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dcac16TH.js'))
			},
			{
				id: "/api/marketplace",
				pattern: /^\/api\/marketplace\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DUZXnpv6.js'))
			},
			{
				id: "/api/mock/compliance/snapshot",
				pattern: /^\/api\/mock\/compliance\/snapshot\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BaXeGq9o.js'))
			},
			{
				id: "/api/nhi",
				pattern: /^\/api\/nhi\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DH-KahKN.js'))
			},
			{
				id: "/api/nhi/[id]",
				pattern: /^\/api\/nhi\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C7sbU_t9.js'))
			},
			{
				id: "/api/notifications",
				pattern: /^\/api\/notifications\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DV4H5Zw1.js'))
			},
			{
				id: "/api/notifications/read-all",
				pattern: /^\/api\/notifications\/read-all\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dw9z6YbK.js'))
			},
			{
				id: "/api/notifications/read",
				pattern: /^\/api\/notifications\/read\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DnZqqH9J.js'))
			},
			{
				id: "/api/operations/metrics",
				pattern: /^\/api\/operations\/metrics\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BaZxCH9T.js'))
			},
			{
				id: "/api/platform/dashboard",
				pattern: /^\/api\/platform\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CzGs4_fc.js'))
			},
			{
				id: "/api/platform/health-deep",
				pattern: /^\/api\/platform\/health-deep\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CqkF5S-j.js'))
			},
			{
				id: "/api/platform/journey-metrics",
				pattern: /^\/api\/platform\/journey-metrics\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CGvaKJDf.js'))
			},
			{
				id: "/api/platform/usage",
				pattern: /^\/api\/platform\/usage\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cylpa9R-.js'))
			},
			{
				id: "/api/policies/generate",
				pattern: /^\/api\/policies\/generate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D3fYMxqo.js'))
			},
			{
				id: "/api/policies/managed",
				pattern: /^\/api\/policies\/managed\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DReuvC0z.js'))
			},
			{
				id: "/api/policies/templates",
				pattern: /^\/api\/policies\/templates\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CgSaPyFZ.js'))
			},
			{
				id: "/api/policies/[id]",
				pattern: /^\/api\/policies\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BLCTIUst.js'))
			},
			{
				id: "/api/policies/[id]/archive",
				pattern: /^\/api\/policies\/([^/]+?)\/archive\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dv0GhERR.js'))
			},
			{
				id: "/api/policies/[id]/review",
				pattern: /^\/api\/policies\/([^/]+?)\/review\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-a7duixMd.js'))
			},
			{
				id: "/api/policies/[id]/submit",
				pattern: /^\/api\/policies\/([^/]+?)\/submit\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BKVO8d-0.js'))
			},
			{
				id: "/api/privacy/dsar",
				pattern: /^\/api\/privacy\/dsar\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CGUabkj4.js'))
			},
			{
				id: "/api/questionnaires",
				pattern: /^\/api\/questionnaires\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DP5vZmMk.js'))
			},
			{
				id: "/api/questionnaires/[id]/generate",
				pattern: /^\/api\/questionnaires\/([^/]+?)\/generate\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CB5wN0Ka.js'))
			},
			{
				id: "/api/reports/generate",
				pattern: /^\/api\/reports\/generate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CC6S9Ou4.js'))
			},
			{
				id: "/api/roles",
				pattern: /^\/api\/roles\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Du35akl2.js'))
			},
			{
				id: "/api/roles/[id]",
				pattern: /^\/api\/roles\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BGaMcbWA.js'))
			},
			{
				id: "/api/roles/[id]/assignments",
				pattern: /^\/api\/roles\/([^/]+?)\/assignments\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-sFE5rHKQ.js'))
			},
			{
				id: "/api/roles/[id]/entitlements",
				pattern: /^\/api\/roles\/([^/]+?)\/entitlements\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-vGP25lbA.js'))
			},
			{
				id: "/api/slack/commands",
				pattern: /^\/api\/slack\/commands\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DJLsisk_.js'))
			},
			{
				id: "/api/slack/events",
				pattern: /^\/api\/slack\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CK2xaSls.js'))
			},
			{
				id: "/api/slack/interactions",
				pattern: /^\/api\/slack\/interactions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Qx2mzE-H.js'))
			},
			{
				id: "/api/support",
				pattern: /^\/api\/support\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CvXQu0UY.js'))
			},
			{
				id: "/api/tenant-compliance/attestations",
				pattern: /^\/api\/tenant-compliance\/attestations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BnhKzAPs.js'))
			},
			{
				id: "/api/tenant-compliance/controls",
				pattern: /^\/api\/tenant-compliance\/controls\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D97G_hLt.js'))
			},
			{
				id: "/api/tenant-compliance/evaluate",
				pattern: /^\/api\/tenant-compliance\/evaluate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-F63PcOn6.js'))
			},
			{
				id: "/api/tenant-compliance/evidence",
				pattern: /^\/api\/tenant-compliance\/evidence\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DzVfnVeg.js'))
			},
			{
				id: "/api/tenant-compliance/evidence/[id]/link",
				pattern: /^\/api\/tenant-compliance\/evidence\/([^/]+?)\/link\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CdG-p3Vh.js'))
			},
			{
				id: "/api/tenant-compliance/history",
				pattern: /^\/api\/tenant-compliance\/history\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-TH8JU7Yq.js'))
			},
			{
				id: "/api/tenant-compliance/scores",
				pattern: /^\/api\/tenant-compliance\/scores\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CQHof2BU.js'))
			},
			{
				id: "/api/tenants/preferences",
				pattern: /^\/api\/tenants\/preferences\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DGEJqnEQ.js'))
			},
			{
				id: "/api/tenant/audit-log",
				pattern: /^\/api\/tenant\/audit-log\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BcpMIERy.js'))
			},
			{
				id: "/api/tenant/audit-log/export",
				pattern: /^\/api\/tenant\/audit-log\/export\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C7gyvdh-.js'))
			},
			{
				id: "/api/tenant/dashboard",
				pattern: /^\/api\/tenant\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CYDOlrSA.js'))
			},
			{
				id: "/api/tenant/dashboard/dismiss-review-suggestion",
				pattern: /^\/api\/tenant\/dashboard\/dismiss-review-suggestion\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DnulMFLD.js'))
			},
			{
				id: "/api/tenant/security",
				pattern: /^\/api\/tenant\/security\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CMoujAaN.js'))
			},
			{
				id: "/api/tenant/settings",
				pattern: /^\/api\/tenant\/settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BznRGlOc.js'))
			},
			{
				id: "/api/tenant/sso",
				pattern: /^\/api\/tenant\/sso\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BJC6xr67.js'))
			},
			{
				id: "/api/tenant/sso/metadata-fetch",
				pattern: /^\/api\/tenant\/sso\/metadata-fetch\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Oc5C-uaQ.js'))
			},
			{
				id: "/api/tenant/users",
				pattern: /^\/api\/tenant\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B5-8bXdl.js'))
			},
			{
				id: "/api/tenant/users/invite",
				pattern: /^\/api\/tenant\/users\/invite\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DmhWhiEW.js'))
			},
			{
				id: "/api/tenant/users/[id]",
				pattern: /^\/api\/tenant\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B6x96XDb.js'))
			},
			{
				id: "/api/trust/access-requests",
				pattern: /^\/api\/trust\/access-requests\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CKQQkXst.js'))
			},
			{
				id: "/api/trust/settings",
				pattern: /^\/api\/trust\/settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BC3i_7U_.js'))
			},
			{
				id: "/api/trust/[slug]",
				pattern: /^\/api\/trust\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DIaEXFp6.js'))
			},
			{
				id: "/api/trust/[slug]/access-request",
				pattern: /^\/api\/trust\/([^/]+?)\/access-request\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DaQf50Xa.js'))
			},
			{
				id: "/api/trust/[slug]/badge",
				pattern: /^\/api\/trust\/([^/]+?)\/badge\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-feVNwk3f.js'))
			},
			{
				id: "/api/trust/[slug]/evidence",
				pattern: /^\/api\/trust\/([^/]+?)\/evidence\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DIStAHhH.js'))
			},
			{
				id: "/api/trust/[slug]/export",
				pattern: /^\/api\/trust\/([^/]+?)\/export\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CU6u57fp.js'))
			},
			{
				id: "/api/user/password",
				pattern: /^\/api\/user\/password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DQxdhzb5.js'))
			},
			{
				id: "/api/user/preferences",
				pattern: /^\/api\/user\/preferences\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CRmBEzud.js'))
			},
			{
				id: "/api/user/profile",
				pattern: /^\/api\/user\/profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CpJ2iHj5.js'))
			},
			{
				id: "/api/workflows/execute",
				pattern: /^\/api\/workflows\/execute\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-ByYbljkS.js'))
			},
			{
				id: "/console",
				pattern: /^\/console\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/console/access-requests",
				pattern: /^\/console\/access-requests\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/console/access-reviews",
				pattern: /^\/console\/access-reviews\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/console/access-reviews/[id]",
				pattern: /^\/console\/access-reviews\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/console/admin",
				pattern: /^\/console\/admin\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/console/admin/operations",
				pattern: /^\/console\/admin\/operations\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/console/analytics",
				pattern: /^\/console\/analytics\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/console/apps",
				pattern: /^\/console\/apps\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/console/attestations",
				pattern: /^\/console\/attestations\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/console/audit",
				pattern: /^\/console\/audit\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/console/automation",
				pattern: /^\/console\/automation\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/console/automation/builder",
				pattern: /^\/console\/automation\/builder\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/console/automation/runs",
				pattern: /^\/console\/automation\/runs\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/console/compliance",
				pattern: /^\/console\/compliance\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/console/compliance/attestations",
				pattern: /^\/console\/compliance\/attestations\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/console/compliance/audit-package",
				pattern: /^\/console\/compliance\/audit-package\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/console/compliance/controls",
				pattern: /^\/console\/compliance\/controls\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/console/compliance/evidence",
				pattern: /^\/console\/compliance\/evidence\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/console/compliance/feed",
				pattern: /^\/console\/compliance\/feed\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/console/compliance/packs",
				pattern: /^\/console\/compliance\/packs\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/console/demo",
				pattern: /^\/console\/demo\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/console/directory",
				pattern: /^\/console\/directory\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/console/directory/groups/[id]",
				pattern: /^\/console\/directory\/groups\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/console/directory/users/[id]",
				pattern: /^\/console\/directory\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/console/discovery",
				pattern: /^\/console\/discovery\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/console/evidence",
				pattern: /^\/console\/evidence\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/console/incidents",
				pattern: /^\/console\/incidents\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/console/insights",
				pattern: /^\/console\/insights\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/console/integrations",
				pattern: /^\/console\/integrations\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/console/jml-changelog",
				pattern: /^\/console\/jml-changelog\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/console/jml/changelog",
				pattern: /^\/console\/jml\/changelog\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/console/login",
				pattern: /^\/console\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/console/marketplace",
				pattern: /^\/console\/marketplace\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/console/nhi-governance",
				pattern: /^\/console\/nhi-governance\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/console/nhi",
				pattern: /^\/console\/nhi\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/console/onboarding",
				pattern: /^\/console\/onboarding\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/console/packs",
				pattern: /^\/console\/packs\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/console/platform-status",
				pattern: /^\/console\/platform-status\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 43 },
				endpoint: null
			},
			{
				id: "/console/policies",
				pattern: /^\/console\/policies\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 44 },
				endpoint: null
			},
			{
				id: "/console/profile",
				pattern: /^\/console\/profile\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 45 },
				endpoint: null
			},
			{
				id: "/console/reports",
				pattern: /^\/console\/reports\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 46 },
				endpoint: null
			},
			{
				id: "/console/rules",
				pattern: /^\/console\/rules\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 47 },
				endpoint: null
			},
			{
				id: "/console/runs",
				pattern: /^\/console\/runs\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 48 },
				endpoint: null
			},
			{
				id: "/console/settings",
				pattern: /^\/console\/settings\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 49 },
				endpoint: null
			},
			{
				id: "/console/settings/audit-log",
				pattern: /^\/console\/settings\/audit-log\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 50 },
				endpoint: null
			},
			{
				id: "/console/settings/billing",
				pattern: /^\/console\/settings\/billing\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 51 },
				endpoint: null
			},
			{
				id: "/console/settings/general",
				pattern: /^\/console\/settings\/general\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 52 },
				endpoint: null
			},
			{
				id: "/console/settings/incidents",
				pattern: /^\/console\/settings\/incidents\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 53 },
				endpoint: null
			},
			{
				id: "/console/settings/notifications",
				pattern: /^\/console\/settings\/notifications\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 54 },
				endpoint: null
			},
			{
				id: "/console/settings/preferences",
				pattern: /^\/console\/settings\/preferences\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 55 },
				endpoint: null
			},
			{
				id: "/console/settings/security",
				pattern: /^\/console\/settings\/security\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 56 },
				endpoint: null
			},
			{
				id: "/console/settings/trust",
				pattern: /^\/console\/settings\/trust\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 57 },
				endpoint: null
			},
			{
				id: "/console/settings/trust/questionnaires",
				pattern: /^\/console\/settings\/trust\/questionnaires\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 58 },
				endpoint: null
			},
			{
				id: "/console/settings/users",
				pattern: /^\/console\/settings\/users\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 59 },
				endpoint: null
			},
			{
				id: "/console/status",
				pattern: /^\/console\/status\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 60 },
				endpoint: null
			},
			{
				id: "/console/workflows",
				pattern: /^\/console\/workflows\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 61 },
				endpoint: null
			},
			{
				id: "/demo",
				pattern: /^\/demo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 62 },
				endpoint: null
			},
			{
				id: "/developers",
				pattern: /^\/developers\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 63 },
				endpoint: null
			},
			{
				id: "/faq",
				pattern: /^\/faq\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 64 },
				endpoint: null
			},
			{
				id: "/health",
				pattern: /^\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BijDZID2.js'))
			},
			{
				id: "/incidents",
				pattern: /^\/incidents\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 65 },
				endpoint: null
			},
			{
				id: "/interactive-demo",
				pattern: /^\/interactive-demo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 66 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 67 },
				endpoint: null
			},
			{
				id: "/login/forgot",
				pattern: /^\/login\/forgot\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 68 },
				endpoint: null
			},
			{
				id: "/logout",
				pattern: /^\/logout\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 69 },
				endpoint: null
			},
			{
				id: "/marketplace",
				pattern: /^\/marketplace\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 70 },
				endpoint: null
			},
			{
				id: "/marketplace/[appId]",
				pattern: /^\/marketplace\/([^/]+?)\/?$/,
				params: [{"name":"appId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 71 },
				endpoint: null
			},
			{
				id: "/notifications",
				pattern: /^\/notifications\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 72 },
				endpoint: null
			},
			{
				id: "/pricing",
				pattern: /^\/pricing\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 73 },
				endpoint: null
			},
			{
				id: "/privacy",
				pattern: /^\/privacy\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 74 },
				endpoint: null
			},
			{
				id: "/privacy/dsar",
				pattern: /^\/privacy\/dsar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 75 },
				endpoint: null
			},
			{
				id: "/see-atlasit-live",
				pattern: /^\/see-atlasit-live\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 76 },
				endpoint: null
			},
			{
				id: "/signup",
				pattern: /^\/signup\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 77 },
				endpoint: null
			},
			{
				id: "/status",
				pattern: /^\/status\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 78 },
				endpoint: null
			},
			{
				id: "/support",
				pattern: /^\/support\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 79 },
				endpoint: null
			},
			{
				id: "/terms",
				pattern: /^\/terms\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 80 },
				endpoint: null
			},
			{
				id: "/trust/[slug]",
				pattern: /^\/trust\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 81 },
				endpoint: null
			},
			{
				id: "/trust/[slug]/embed",
				pattern: /^\/trust\/([^/]+?)\/embed\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 82 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
