module.exports=[18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},43044,e=>{"use strict";var t=e.i(24514),r=e.i(25579),a=e.i(6109),n=e.i(48013),s=e.i(39247),o=e.i(96953),i=e.i(11819),l=e.i(99480),u=e.i(85917),d=e.i(70898),p=e.i(74792),c=e.i(84758),h=e.i(47854),x=e.i(18005),R=e.i(21961),m=e.i(93695);e.i(88104);var f=e.i(35456),g=e.i(82445);let v="AITOLL_API_KEY";async function w(e){let t=process.env[v];if(!t)throw Error(`${v} 未配置，请在 .env.local 中添加`);let r=await fetch("https://aitoll.net/api/gateway/api/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!r.ok){let e=await r.text();throw Error(`API 调用失败: ${r.status} ${e}`)}return r.json()}async function y(e,t={}){let r,{model:a="deepseek-chat",systemPrompt:n,temperature:s,maxTokens:o}=t;"string"==typeof e?(r=[],n&&r.push({role:"system",content:n}),r.push({role:"user",content:e})):r=e;let i=await w({model:a,messages:r,temperature:s,max_tokens:o,stream:!1});return{reply:i.choices[0]?.message?.content||"",usage:i.usage}}async function E(e){try{let t=await e.json();if(!t.title?.trim()||!t.description?.trim())return g.NextResponse.json({error:"请提供创意名称和描述"},{status:400});let r=`你是一位资深产品经理和独立开发者顾问。用户有一个产品创意，请帮他完成需求分析和 MVP 规划。

## 用户的创意

名称：${t.title}
描述：${t.description}
目标用户/痛点：${t.targetUser}

## 请输出以下内容

1. 需求分析
   - 核心痛点（2-3句话，直击本质）
   - 目标用户画像（1-2句话）
   - 关键功能建议（5个以内，简洁有力）
   - 潜在风险（1-2个）
   - 差异化机会（1-2句话）

2. MVP 规划（2周可验证版）
   - 核心功能（最多4个，每个1句话说明）
   - 明确不做的事（最多4个）
   - 成功验证标准（1-2个可量化指标）
   - 粗略时间线（按周简述）

3. 简要技术建议（1-2句话，适合新手，推荐具体的技术栈）

## 输出格式

必须严格按以下 JSON 格式输出，不要包含 markdown 代码块标记，直接输出 JSON：

{
  "analysis": {
    "painPoints": "...",
    "targetUsers": "...",
    "keyFeatures": ["...", "..."],
    "risks": "...",
    "opportunities": "..."
  },
  "mvpPlan": {
    "coreFeatures": ["...", "..."],
    "outOfScope": ["...", "..."],
    "successCriteria": "...",
    "timeline": "..."
  },
  "techSuggestion": "..."
}`,{reply:a,usage:n}=await y(r,{model:"deepseek-chat",temperature:.7,maxTokens:4e3});try{let e=function(e){let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)return JSON.parse(t[1].trim());let r=e.match(/\{[\s\S]*\}/);if(r)return JSON.parse(r[0]);throw Error("无法从响应中提取 JSON")}(a);return g.NextResponse.json({...e,_raw:a,_usage:n})}catch{return g.NextResponse.json({raw:a,_usage:n})}}catch(t){console.error("AI 分析失败:",t);let e=t instanceof Error?t.message:"未知错误";return g.NextResponse.json({error:`AI 分析失败: ${e}`},{status:500})}}e.s(["POST",()=>E],23892);var C=e.i(23892);let A=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/analyze/route",pathname:"/api/analyze",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/analyze/route.ts",nextConfigOutput:"",userland:C}),{workAsyncStorage:N,workUnitAsyncStorage:O,serverHooks:P}=A;function S(){return(0,a.patchFetch)({workAsyncStorage:N,workUnitAsyncStorage:O})}async function k(e,t,a){A.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let g="/api/analyze/route";g=g.replace(/\/index$/,"")||"/";let v=await A.prepare(e,t,{srcPage:g,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:w,params:y,nextConfig:E,parsedUrl:C,isDraftMode:N,prerenderManifest:O,routerServerContext:P,isOnDemandRevalidate:S,revalidateOnlyGenerated:k,resolvedPathname:T,clientReferenceManifest:b,serverActionsManifest:_}=v,j=(0,i.normalizeAppPath)(g),q=!!(O.dynamicRoutes[j]||O.routes[T]),I=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,C,!1):t.end("This page could not be found"),null);if(q&&!N){let e=!!O.routes[T],t=O.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await I();throw new m.NoFallbackError}}let U=null;!q||A.isDev||N||(U="/index"===(U=T)?"/":U);let H=!0===A.isDev||!q,$=q&&!H;_&&b&&(0,o.setManifestsSingleton)({page:g,clientReferenceManifest:b,serverActionsManifest:_});let M=e.method||"GET",D=(0,s.getTracer)(),F=D.getActiveScopeSpan(),K={params:y,prerenderManifest:O,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>A.onRequestError(e,t,a,n,P)},sharedContext:{buildId:w}},L=new l.NodeNextRequest(e),z=new l.NodeNextResponse(t),B=u.NextRequestAdapter.fromNodeNextRequest(L,(0,u.signalFromNodeResponse)(t));try{let o=async e=>A.handle(B,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=D.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${M} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${g}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let u=async({previousCacheEntry:r})=>{try{if(!i&&S&&k&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(n);e.fetchMetrics=K.renderOpts.fetchMetrics;let l=K.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let u=K.renderOpts.collectedTags;if(!q)return await (0,c.sendResponse)(L,z,s,K.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(s.headers);u&&(t[R.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,a=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await A.onRequestError(e,t,{routerKind:"App Router",routePath:g,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:$,isOnDemandRevalidate:S})},!1,P),t}},d=await A.handleResponse({req:e,nextConfig:E,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:O,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:k,responseGenerator:u,waitUntil:a.waitUntil,isMinimalMode:i});if(!q)return null;if((null==d||null==(s=d.value)?void 0:s.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",S?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),N&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return i&&q||m.delete(R.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,x.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(L,z,new Response(d.value.body,{headers:m,status:d.value.status||200})),null};F?await l(F):await D.withPropagatedContext(e.headers,()=>D.trace(d.BaseServerSpan.handleRequest,{spanName:`${M} ${g}`,kind:s.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof m.NoFallbackError||await A.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:$,isOnDemandRevalidate:S})},!1,P),q)throw t;return await (0,c.sendResponse)(L,z,new Response(null,{status:500})),null}}e.s(["handler",()=>k,"patchFetch",()=>S,"routeModule",()=>A,"serverHooks",()=>P,"workAsyncStorage",()=>N,"workUnitAsyncStorage",()=>O],43044)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__08dff0ec._.js.map